import React, { useState } from "react";

interface LanguageOption {
    code: string;
    name: string;
}

const languages: LanguageOption[] = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    // Add more languages as needed
];

const mockTranslate = (text: string, targetLang: string): Promise<string> => {
    // Mock translation: just returns the text with language code appended
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`[${targetLang}] ${text}`);
        }, 500);
    });
};

const LanguageTranslator: React.FC = () => {
    const [input, setInput] = useState("");
    const [targetLang, setTargetLang] = useState("es");
    const [translated, setTranslated] = useState("");
    const [loading, setLoading] = useState(false);

    const handleTranslate = async () => {
        setLoading(true);
        const result = await mockTranslate(input, targetLang);
        setTranslated(result);
        setLoading(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">Language Translator</h3>
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={4}
                placeholder="Enter text to translate"
                className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Translate to:
                    <select
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="mt-1 block w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {languages.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <button 
                onClick={handleTranslate} 
                disabled={loading || !input}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? "Translating..." : "Translate"}
            </button>
            {translated && (
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Translated Text:
                    </label>
                    <div className="bg-gray-50 p-3 rounded-md border">
                        {translated}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageTranslator;