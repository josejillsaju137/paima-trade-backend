import { NseIndia } from 'stock-nse-india';

const nseIndia = new NseIndia();

/**
 * Interface representing a fetched market price
 */
export interface MarketData {
    symbol: string;
    price: number;
    timestamp: Date;
}

// Popular Indian Stocks to track
export const TRACKED_SYMBOLS = [
    'RELIANCE',
    'TCS',
    'HDFCBANK',
    'INFY',
    'SBI'
];

/**
 * Service to fetch real market prices using stock-nse-india.
 */
export const fetchIndianMarketPrices = async (): Promise<MarketData[]> => {
    try {
        const marketData: MarketData[] = [];

        // Fetch prices sequentially to avoid overwhelming the NSE endpoints
        for (const symbol of TRACKED_SYMBOLS) {
            try {
                const details = await nseIndia.getEquityDetails(symbol);

                if (details && details.priceInfo && details.priceInfo.lastPrice) {
                    marketData.push({
                        symbol,
                        price: Number(details.priceInfo.lastPrice),
                        timestamp: new Date()
                    });
                }
            } catch (err) {
                console.error(`Failed to fetch live price for ${symbol}:`, err);
                // Continue fetching other symbols even if one fails
            }
        }

        return marketData;
    } catch (error) {
        console.error(`Error in fetchIndianMarketPrices:`, error);
        throw error;
    }
};
