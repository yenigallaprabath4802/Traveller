const axios = require('axios');

class AmadeusAPI {
  constructor() {
    this.clientId = process.env.AMADEUS_CLIENT_ID;
    this.clientSecret = process.env.AMADEUS_CLIENT_SECRET;
    this.baseURL = process.env.AMADEUS_ENV === 'production' 
      ? 'https://api.amadeus.com' 
      : 'https://test.api.amadeus.com';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    try {
      const response = await axios.post(`${this.baseURL}/v1/security/oauth2/token`, {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      return this.accessToken;
    } catch (error) {
      console.error('Amadeus authentication failed:', error);
      throw new Error('Failed to authenticate with Amadeus API');
    }
  }

  async ensureValidToken() {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
    return this.accessToken;
  }

  async searchFlights(params) {
    await this.ensureValidToken();
    
    try {
      const queryParams = {
        originLocationCode: params.origin,
        destinationLocationCode: params.destination,
        departureDate: params.departureDate,
        adults: params.adults || 1,
        children: params.children || 0,
        infants: params.infants || 0,
        travelClass: params.travelClass || 'ECONOMY',
        nonStop: params.nonStop || false,
        currencyCode: params.currency || 'USD',
        max: params.maxResults || 50
      };

      if (params.returnDate) {
        queryParams.returnDate = params.returnDate;
      }

      const response = await axios.get(`${this.baseURL}/v2/shopping/flight-offers`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        params: queryParams
      });

      return this.processFlightResults(response.data);
    } catch (error) {
      console.error('Flight search failed:', error);
      throw new Error('Flight search failed');
    }
  }

  processFlightResults(data) {
    if (!data.data) return { flights: [], meta: {} };

    const flights = data.data.map(offer => {
      const itinerary = offer.itineraries[0];
      const outbound = itinerary.segments[0];
      const returnItinerary = offer.itineraries[1];
      
      return {
        id: offer.id,
        price: {
          total: parseFloat(offer.price.total),
          currency: offer.price.currency,
          base: parseFloat(offer.price.base || offer.price.total),
          fees: offer.price.fees || []
        },
        outbound: {
          departure: {
            airport: outbound.departure.iataCode,
            terminal: outbound.departure.terminal,
            time: outbound.departure.at
          },
          arrival: {
            airport: outbound.arrival.iataCode,
            terminal: outbound.arrival.terminal,
            time: outbound.arrival.at
          },
          duration: itinerary.duration,
          carrier: outbound.carrierCode,
          flightNumber: outbound.number,
          aircraft: outbound.aircraft?.code,
          stops: itinerary.segments.length - 1
        },
        return: returnItinerary ? {
          departure: {
            airport: returnItinerary.segments[0].departure.iataCode,
            terminal: returnItinerary.segments[0].departure.terminal,
            time: returnItinerary.segments[0].departure.at
          },
          arrival: {
            airport: returnItinerary.segments[returnItinerary.segments.length - 1].arrival.iataCode,
            terminal: returnItinerary.segments[returnItinerary.segments.length - 1].arrival.terminal,
            time: returnItinerary.segments[returnItinerary.segments.length - 1].arrival.at
          },
          duration: returnItinerary.duration,
          carrier: returnItinerary.segments[0].carrierCode,
          flightNumber: returnItinerary.segments[0].number,
          stops: returnItinerary.segments.length - 1
        } : null,
        airline: data.dictionaries?.carriers?.[outbound.carrierCode] || outbound.carrierCode,
        validatingAirline: offer.validatingAirlineCodes?.[0],
        lastTicketingDate: offer.lastTicketingDate,
        numberOfBookableSeats: offer.numberOfBookableSeats,
        fareDetailsBySegment: offer.travelerPricings?.[0]?.fareDetailsBySegment || []
      };
    });

    return {
      flights,
      meta: {
        count: flights.length,
        currency: data.meta?.currency,
        defaults: data.meta?.defaults
      },
      dictionaries: data.dictionaries
    };
  }

  async searchHotels(params) {
    await this.ensureValidToken();
    
    try {
      const queryParams = {
        cityCode: params.cityCode,
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        adults: params.adults || 2,
        roomQuantity: params.rooms || 1,
        priceRange: params.priceRange || '1-999',
        currency: params.currency || 'USD',
        sort: params.sort || 'PRICE',
        lang: params.language || 'EN'
      };

      if (params.latitude && params.longitude) {
        queryParams.latitude = params.latitude;
        queryParams.longitude = params.longitude;
        queryParams.radius = params.radius || 5;
        queryParams.radiusUnit = 'KM';
        delete queryParams.cityCode;
      }

      const response = await axios.get(`${this.baseURL}/v3/shopping/hotel-offers`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        params: queryParams
      });

      return this.processHotelResults(response.data);
    } catch (error) {
      console.error('Hotel search failed:', error);
      throw new Error('Hotel search failed');
    }
  }

  processHotelResults(data) {
    if (!data.data) return { hotels: [], meta: {} };

    const hotels = data.data.map(hotel => {
      const hotelInfo = hotel.hotel;
      const offers = hotel.offers || [];
      const bestOffer = offers[0];

      return {
        id: hotelInfo.hotelId,
        name: hotelInfo.name,
        chainCode: hotelInfo.chainCode,
        dupeId: hotelInfo.dupeId,
        location: {
          latitude: hotelInfo.geoCode?.latitude,
          longitude: hotelInfo.geoCode?.longitude,
          address: hotelInfo.address
        },
        contact: hotelInfo.contact,
        description: hotelInfo.description,
        amenities: hotelInfo.amenities || [],
        media: hotelInfo.media || [],
        rating: hotelInfo.rating,
        lastUpdate: hotelInfo.lastUpdate,
        offers: offers.map(offer => ({
          id: offer.id,
          checkInDate: offer.checkInDate,
          checkOutDate: offer.checkOutDate,
          rateCode: offer.rateCode,
          rateFamilyEstimated: offer.rateFamilyEstimated,
          room: {
            type: offer.room?.type,
            typeEstimated: offer.room?.typeEstimated,
            description: offer.room?.description
          },
          guests: offer.guests,
          price: {
            currency: offer.price?.currency,
            base: parseFloat(offer.price?.base || 0),
            total: parseFloat(offer.price?.total || 0),
            variations: offer.price?.variations || {}
          },
          policies: offer.policies,
          self: offer.self
        })),
        bestPrice: bestOffer ? {
          currency: bestOffer.price?.currency,
          total: parseFloat(bestOffer.price?.total || 0),
          perNight: parseFloat(bestOffer.price?.base || 0)
        } : null
      };
    });

    return {
      hotels,
      meta: {
        count: hotels.length,
        links: data.meta?.links
      }
    };
  }

  async getAirportInfo(iataCode) {
    await this.ensureValidToken();
    
    try {
      const response = await axios.get(`${this.baseURL}/v1/reference-data/locations`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        params: {
          keyword: iataCode,
          subType: 'AIRPORT'
        }
      });

      return response.data.data?.[0] || null;
    } catch (error) {
      console.error('Airport info fetch failed:', error);
      return null;
    }
  }

  async getCityInfo(keyword) {
    await this.ensureValidToken();
    
    try {
      const response = await axios.get(`${this.baseURL}/v1/reference-data/locations`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        params: {
          keyword,
          subType: 'CITY'
        }
      });

      return response.data.data || [];
    } catch (error) {
      console.error('City info fetch failed:', error);
      return [];
    }
  }

  async getFlightPriceAnalysis(params) {
    await this.ensureValidToken();
    
    try {
      const response = await axios.get(`${this.baseURL}/v1/analytics/itinerary-price-metrics`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        params: {
          originIataCode: params.origin,
          destinationIataCode: params.destination,
          departureDate: params.departureDate,
          currencyCode: params.currency || 'USD'
        }
      });

      return response.data.data || null;
    } catch (error) {
      console.error('Price analysis failed:', error);
      return null;
    }
  }
}

class SkyscannerAPI {
  constructor() {
    this.apiKey = process.env.SKYSCANNER_API_KEY;
    this.baseURL = 'https://partners.api.skyscanner.net';
  }

  async searchFlights(params) {
    try {
      // Create search session
      const searchResponse = await axios.post(
        `${this.baseURL}/apiservices/browsequotes/v1.0/${params.country || 'US'}/${params.currency || 'USD'}/${params.locale || 'en-US'}/${params.origin}/${params.destination}/${params.departureDate}`,
        {},
        {
          headers: {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': 'skyscanner-skyscanner-flight-search-v1.p.rapidapi.com'
          },
          params: {
            inboundpartialdate: params.returnDate
          }
        }
      );

      return this.processSkyscannerResults(searchResponse.data);
    } catch (error) {
      console.error('Skyscanner search failed:', error);
      throw new Error('Skyscanner search failed');
    }
  }

  processSkyscannerResults(data) {
    const quotes = data.Quotes || [];
    const places = data.Places || [];
    const carriers = data.Carriers || [];

    const placeMap = {};
    places.forEach(place => {
      placeMap[place.PlaceId] = place;
    });

    const carrierMap = {};
    carriers.forEach(carrier => {
      carrierMap[carrier.CarrierId] = carrier;
    });

    const flights = quotes.map(quote => {
      const outbound = quote.OutboundLeg;
      const inbound = quote.InboundLeg;

      return {
        id: quote.QuoteId,
        price: {
          total: quote.MinPrice,
          currency: data.Currencies?.[0]?.Symbol || 'USD'
        },
        direct: quote.Direct,
        outbound: {
          departure: {
            airport: placeMap[outbound.OriginId]?.IataCode,
            place: placeMap[outbound.OriginId]?.Name
          },
          arrival: {
            airport: placeMap[outbound.DestinationId]?.IataCode,
            place: placeMap[outbound.DestinationId]?.Name
          },
          date: outbound.DepartureDate,
          carriers: outbound.CarrierIds?.map(id => carrierMap[id]?.Name) || []
        },
        return: inbound ? {
          departure: {
            airport: placeMap[inbound.OriginId]?.IataCode,
            place: placeMap[inbound.OriginId]?.Name
          },
          arrival: {
            airport: placeMap[inbound.DestinationId]?.IataCode,
            place: placeMap[inbound.DestinationId]?.Name
          },
          date: inbound.DepartureDate,
          carriers: inbound.CarrierIds?.map(id => carrierMap[id]?.Name) || []
        } : null,
        quoteDateTime: quote.QuoteDateTime
      };
    });

    return {
      flights,
      meta: {
        count: flights.length,
        currency: data.Currencies?.[0]
      }
    };
  }

  async getPlaces(query) {
    try {
      const response = await axios.get(
        `${this.baseURL}/apiservices/autosuggest/v1.0/US/USD/en-US/`,
        {
          headers: {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': 'skyscanner-skyscanner-flight-search-v1.p.rapidapi.com'
          },
          params: { query }
        }
      );

      return response.data.Places || [];
    } catch (error) {
      console.error('Skyscanner places search failed:', error);
      return [];
    }
  }
}

class LiveTravelDataService {
  constructor() {
    this.amadeus = new AmadeusAPI();
    this.skyscanner = new SkyscannerAPI();
    this.priceCache = new Map();
    this.cacheExpiry = 15 * 60 * 1000; // 15 minutes
  }

  async searchFlights(params, providers = ['amadeus', 'skyscanner']) {
    const results = {
      success: true,
      data: {
        flights: [],
        providers: {},
        comparison: {},
        recommendations: {}
      },
      meta: {
        searchParams: params,
        timestamp: new Date().toISOString(),
        providers: providers
      }
    };

    try {
      const searches = [];

      // Amadeus search
      if (providers.includes('amadeus')) {
        searches.push(
          this.amadeus.searchFlights(params)
            .then(data => ({ provider: 'amadeus', data }))
            .catch(error => ({ provider: 'amadeus', error: error.message }))
        );
      }

      // Skyscanner search
      if (providers.includes('skyscanner')) {
        searches.push(
          this.skyscanner.searchFlights(params)
            .then(data => ({ provider: 'skyscanner', data }))
            .catch(error => ({ provider: 'skyscanner', error: error.message }))
        );
      }

      const searchResults = await Promise.all(searches);

      // Process results
      for (const result of searchResults) {
        if (result.error) {
          results.data.providers[result.provider] = { error: result.error };
        } else {
          results.data.providers[result.provider] = result.data;
          if (result.data.flights) {
            results.data.flights.push(...result.data.flights.map(flight => ({
              ...flight,
              provider: result.provider
            })));
          }
        }
      }

      // Sort by price
      results.data.flights.sort((a, b) => (a.price?.total || 0) - (b.price?.total || 0));

      // Generate comparison and recommendations
      results.data.comparison = this.generateFlightComparison(results.data.flights);
      results.data.recommendations = this.generateFlightRecommendations(results.data.flights);

      return results;
    } catch (error) {
      console.error('Flight search error:', error);
      return {
        success: false,
        error: error.message,
        data: results.data,
        meta: results.meta
      };
    }
  }

  async searchHotels(params, providers = ['amadeus']) {
    const results = {
      success: true,
      data: {
        hotels: [],
        providers: {},
        comparison: {},
        recommendations: {}
      },
      meta: {
        searchParams: params,
        timestamp: new Date().toISOString(),
        providers: providers
      }
    };

    try {
      const searches = [];

      // Amadeus search
      if (providers.includes('amadeus')) {
        searches.push(
          this.amadeus.searchHotels(params)
            .then(data => ({ provider: 'amadeus', data }))
            .catch(error => ({ provider: 'amadeus', error: error.message }))
        );
      }

      const searchResults = await Promise.all(searches);

      // Process results
      for (const result of searchResults) {
        if (result.error) {
          results.data.providers[result.provider] = { error: result.error };
        } else {
          results.data.providers[result.provider] = result.data;
          if (result.data.hotels) {
            results.data.hotels.push(...result.data.hotels.map(hotel => ({
              ...hotel,
              provider: result.provider
            })));
          }
        }
      }

      // Sort by price
      results.data.hotels.sort((a, b) => (a.bestPrice?.total || 0) - (b.bestPrice?.total || 0));

      // Generate comparison and recommendations
      results.data.comparison = this.generateHotelComparison(results.data.hotels);
      results.data.recommendations = this.generateHotelRecommendations(results.data.hotels);

      return results;
    } catch (error) {
      console.error('Hotel search error:', error);
      return {
        success: false,
        error: error.message,
        data: results.data,
        meta: results.meta
      };
    }
  }

  generateFlightComparison(flights) {
    if (!flights.length) return {};

    const prices = flights.map(f => f.price?.total || 0).filter(p => p > 0);
    const durations = flights.map(f => this.parseDuration(f.outbound?.duration)).filter(d => d > 0);

    return {
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: prices.reduce((a, b) => a + b, 0) / prices.length,
        median: this.calculateMedian(prices)
      },
      durationRange: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        average: durations.reduce((a, b) => a + b, 0) / durations.length
      },
      providerCount: [...new Set(flights.map(f => f.provider))].length,
      directFlights: flights.filter(f => f.outbound?.stops === 0).length,
      totalOptions: flights.length
    };
  }

  generateFlightRecommendations(flights) {
    if (!flights.length) return {};

    const cheapest = flights.reduce((min, flight) => 
      (flight.price?.total || Infinity) < (min.price?.total || Infinity) ? flight : min
    );

    const fastest = flights.reduce((min, flight) => {
      const duration = this.parseDuration(flight.outbound?.duration);
      const minDuration = this.parseDuration(min.outbound?.duration);
      return duration < minDuration ? flight : min;
    });

    const directFlights = flights.filter(f => f.outbound?.stops === 0);
    const bestDirect = directFlights.length > 0 ? directFlights[0] : null;

    return {
      cheapest: {
        flight: cheapest,
        savings: flights.length > 1 ? 
          Math.round(((flights[flights.length - 1].price?.total || 0) - (cheapest.price?.total || 0))) : 0
      },
      fastest: {
        flight: fastest,
        timeSaved: flights.length > 1 ?
          this.parseDuration(flights[flights.length - 1].outbound?.duration) - this.parseDuration(fastest.outbound?.duration) : 0
      },
      bestDirect: bestDirect ? {
        flight: bestDirect,
        premium: Math.round((bestDirect.price?.total || 0) - (cheapest.price?.total || 0))
      } : null,
      bestValue: this.calculateBestValueFlight(flights)
    };
  }

  generateHotelComparison(hotels) {
    if (!hotels.length) return {};

    const prices = hotels.map(h => h.bestPrice?.total || 0).filter(p => p > 0);
    const ratings = hotels.map(h => parseFloat(h.rating || 0)).filter(r => r > 0);

    return {
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: prices.reduce((a, b) => a + b, 0) / prices.length,
        median: this.calculateMedian(prices)
      },
      ratingRange: {
        min: Math.min(...ratings),
        max: Math.max(...ratings),
        average: ratings.reduce((a, b) => a + b, 0) / ratings.length
      },
      totalOptions: hotels.length
    };
  }

  generateHotelRecommendations(hotels) {
    if (!hotels.length) return {};

    const cheapest = hotels.reduce((min, hotel) => 
      (hotel.bestPrice?.total || Infinity) < (min.bestPrice?.total || Infinity) ? hotel : min
    );

    const highestRated = hotels.reduce((max, hotel) => 
      parseFloat(hotel.rating || 0) > parseFloat(max.rating || 0) ? hotel : max
    );

    return {
      cheapest: {
        hotel: cheapest,
        savings: hotels.length > 1 ? 
          Math.round(((hotels[hotels.length - 1].bestPrice?.total || 0) - (cheapest.bestPrice?.total || 0))) : 0
      },
      highestRated: {
        hotel: highestRated,
        premium: Math.round((highestRated.bestPrice?.total || 0) - (cheapest.bestPrice?.total || 0))
      },
      bestValue: this.calculateBestValueHotel(hotels)
    };
  }

  calculateBestValueFlight(flights) {
    if (!flights.length) return null;

    // Score based on price (40%), duration (30%), stops (20%), rating (10%)
    const scoredFlights = flights.map(flight => {
      const price = flight.price?.total || 0;
      const duration = this.parseDuration(flight.outbound?.duration);
      const stops = flight.outbound?.stops || 0;
      
      const priceScore = price > 0 ? (1 - (price / Math.max(...flights.map(f => f.price?.total || 0)))) * 40 : 0;
      const durationScore = duration > 0 ? (1 - (duration / Math.max(...flights.map(f => this.parseDuration(f.outbound?.duration))))) * 30 : 0;
      const stopsScore = (1 - Math.min(stops / 3, 1)) * 20;
      const ratingScore = 10; // Default rating since flights don't have ratings

      return {
        flight,
        score: priceScore + durationScore + stopsScore + ratingScore
      };
    });

    const bestValue = scoredFlights.reduce((max, current) => 
      current.score > max.score ? current : max
    );

    return bestValue.flight;
  }

  calculateBestValueHotel(hotels) {
    if (!hotels.length) return null;

    // Score based on price (40%), rating (40%), amenities (20%)
    const scoredHotels = hotels.map(hotel => {
      const price = hotel.bestPrice?.total || 0;
      const rating = parseFloat(hotel.rating || 0);
      const amenityCount = hotel.amenities?.length || 0;
      
      const priceScore = price > 0 ? (1 - (price / Math.max(...hotels.map(h => h.bestPrice?.total || 0)))) * 40 : 0;
      const ratingScore = rating > 0 ? (rating / 5) * 40 : 0;
      const amenityScore = Math.min(amenityCount / 10, 1) * 20;

      return {
        hotel,
        score: priceScore + ratingScore + amenityScore
      };
    });

    const bestValue = scoredHotels.reduce((max, current) => 
      current.score > max.score ? current : max
    );

    return bestValue.hotel;
  }

  parseDuration(duration) {
    if (!duration) return 0;
    
    // Parse ISO 8601 duration (PT1H30M) or other formats
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (match) {
      const hours = parseInt(match[1] || 0);
      const minutes = parseInt(match[2] || 0);
      return hours * 60 + minutes;
    }
    
    return 0;
  }

  calculateMedian(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  async trackPrices(params) {
    const cacheKey = JSON.stringify(params);
    const cachedData = this.priceCache.get(cacheKey);
    
    if (cachedData && Date.now() - cachedData.timestamp < this.cacheExpiry) {
      return {
        ...cachedData.data,
        cached: true,
        lastUpdate: new Date(cachedData.timestamp).toISOString()
      };
    }

    try {
      let data;
      if (params.type === 'flight') {
        data = await this.searchFlights(params);
      } else if (params.type === 'hotel') {
        data = await this.searchHotels(params);
      }

      this.priceCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return {
        ...data,
        cached: false,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Price tracking error:', error);
      throw error;
    }
  }

  async getLocationSuggestions(query) {
    try {
      const [amadeusResults, skyscannerResults] = await Promise.allSettled([
        this.amadeus.getCityInfo(query),
        this.skyscanner.getPlaces(query)
      ]);

      const suggestions = [];

      if (amadeusResults.status === 'fulfilled') {
        suggestions.push(...amadeusResults.value.map(city => ({
          id: city.iataCode,
          name: city.name,
          type: city.subType,
          country: city.address?.countryName,
          provider: 'amadeus'
        })));
      }

      if (skyscannerResults.status === 'fulfilled') {
        suggestions.push(...skyscannerResults.value.map(place => ({
          id: place.PlaceId,
          name: place.PlaceName,
          type: place.PlaceType,
          country: place.CountryName,
          provider: 'skyscanner'
        })));
      }

      // Remove duplicates
      const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
        index === self.findIndex(s => s.name === suggestion.name && s.country === suggestion.country)
      );

      return uniqueSuggestions;
    } catch (error) {
      console.error('Location suggestions error:', error);
      return [];
    }
  }

  async getPriceAlerts(userId) {
    // This would typically fetch from database
    // For now, return mock data
    return {
      active: [
        {
          id: 'alert_1',
          userId,
          type: 'flight',
          route: 'JFK-LAX',
          targetPrice: 299,
          currentPrice: 349,
          priceChange: -15,
          created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      triggered: [],
      recommendations: []
    };
  }
}

module.exports = LiveTravelDataService;