const WIKIPEDIA_API_BASE = "https://en.wikipedia.org/w/api.php";

export const wikipediaService = {
  /**
   * Gets a brief summary of the topic.
   * @param query The topic to search.
   * @returns A promise that resolves to the extract (summary) text.
   */
  async getInfo(query: string): Promise<string | null> {
    try {
      const url = `${WIKIPEDIA_API_BASE}?action=query&prop=extracts&exintro&explaintext&format=json&titles=${encodeURIComponent(query)}&formatversion=2`;
      console.log('📚 Fetching Wikipedia info for:', query);
      console.log('📚 URL:', url);
      
      const response = await fetch(url);
      const text = await response.text();
      console.log('📚 Response text:', text.substring(0, 200));
      
      const data = JSON.parse(text);
      console.log('📚 Parsed data:', JSON.stringify(data, null, 2).substring(0, 500));
      
      const pages = data.query?.pages;
      console.log('📚 Pages:', pages);
      
      if (pages && pages.length > 0) {
        const extract = pages[0]?.extract ?? null;
        console.log('📚 Extract found:', extract ? extract.substring(0, 100) : 'null');
        return extract;
      }
      console.log('📚 No pages found');
      return null;
    } catch (error) {
      console.error("❌ Error fetching Wikipedia info:", error);
      return null;
    }
  },

  /**
   * Gets a representative image for the topic.
   * @param query The topic to search.
   * @returns A promise that resolves to the image URL.
   */
  async getImage(query: string): Promise<string | null> {
    try {
      const url = `${WIKIPEDIA_API_BASE}?action=query&format=json&prop=pageimages&titles=${encodeURIComponent(query)}&pithumbsize=600&formatversion=2`;
      console.log('🖼️ Fetching Wikipedia image for:', query);
      console.log('🖼️ URL:', url);
      
      const response = await fetch(url);
      const text = await response.text();
      console.log('🖼️ Response text:', text.substring(0, 200));
      
      const data = JSON.parse(text);
      console.log('🖼️ Parsed data:', JSON.stringify(data, null, 2).substring(0, 500));
      
      const pages = data.query?.pages;
      console.log('🖼️ Pages:', pages);
      
      if (pages && pages.length > 0) {
        const imageUrl = pages[0]?.thumbnail?.source ?? null;
        console.log('🖼️ Image URL found:', imageUrl);
        return imageUrl;
      }
      console.log('🖼️ No image found');
      return null;
    } catch (error) {
      console.error("❌ Error fetching Wikipedia image:", error);
      return null;
    }
  },

  /**
   * Gets a list of notable tourist spots for a given town.
   * @param town The town to search for tourist spots.
   * @returns A promise that resolves to an array of spot titles (strings).
   */
  async getTouristSpots(town: string): Promise<string[]> {
    try {
      const response = await fetch(
        `${WIKIPEDIA_API_BASE}?action=query&list=search&srsearch=${encodeURIComponent(
          town + " tourist attractions"
        )}&format=json&formatversion=2`
      );
      const data = await response.json();
      const results = data.query?.search ?? [];
      // Return the titles of the top search results
      return results.map((item: any) => item.title);
    } catch (error) {
      console.error("Error fetching tourist spots:", error);
      return [];
    }
  }
};

