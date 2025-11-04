import React, { useState } from 'react';

type Currency = 'USD' | 'EUR' | 'INR';

const rates: Record<Currency, number> = {
    USD: 1,
    EUR: 0.92,
    INR: 83.2,
};

const currencies: Currency[] = ['USD', 'EUR', 'INR'];

const CurrencyConverter: React.FC = () => {
    const [amount, setAmount] = useState<number>(1);
    const [from, setFrom] = useState<Currency>('USD');
    const [to, setTo] = useState<Currency>('EUR');

    const convert = (amt: number, fromCurr: Currency, toCurr: Currency) => {
        if (fromCurr === toCurr) return amt;
        const usdAmount = amt / rates[fromCurr];
        return +(usdAmount * rates[toCurr]).toFixed(2);
    };

    return (
        <div style={{ maxWidth: 400, margin: '2rem auto', padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
            <h2>Currency Converter</h2>
            <div style={{ marginBottom: 12 }}>
                <input
                    type="number"
                    value={amount}
                    min={0}
                    onChange={e => setAmount(Number(e.target.value))}
                    style={{ width: 100, marginRight: 8 }}
                />
                <select value={from} onChange={e => setFrom(e.target.value as Currency)} style={{ marginRight: 8 }}>
                    {currencies.map(curr => (
                        <option key={curr} value={curr}>{curr}</option>
                    ))}
                </select>
                to
                <select value={to} onChange={e => setTo(e.target.value as Currency)} style={{ marginLeft: 8 }}>
                    {currencies.map(curr => (
                        <option key={curr} value={curr}>{curr}</option>
                    ))}
                </select>
            </div>
            <div>
                <strong>Converted Amount:</strong> {convert(amount, from, to)} {to}
            </div>
        </div>
    );
};

export default CurrencyConverter;