const API_BASE_URL = import.meta.env.REACT_APP_BACKEND_URL ? 
  `${import.meta.env.REACT_APP_BACKEND_URL}/api` : 
  '/api'; // Use relative path for proxy

class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Entity operations
  createEntity(entityType) {
    return {
      create: async (data) => {
        return this.request(`/entities/${entityType}`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },
      list: async (sort = '') => {
        const queryParam = sort ? `?sort=${encodeURIComponent(sort)}` : '';
        return this.request(`/entities/${entityType}${queryParam}`);
      },
      get: async (id) => {
        return this.request(`/entities/${entityType}/${id}`);
      },
      update: async (id, data) => {
        return this.request(`/entities/${entityType}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      },
      delete: async (id) => {
        return this.request(`/entities/${entityType}/${id}`, {
          method: 'DELETE',
        });
      },
      filter: async (filters) => {
        return this.request(`/entities/${entityType}/filter`, {
          method: 'POST',
          body: JSON.stringify(filters),
        });
      },
    };
  }

  // File upload
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    return await response.json();
  }
}

// Create client instance
const client = new APIClient(API_BASE_URL);

// Export compatible interface matching Base44 SDK structure
export const connectapodAPI = {
  entities: {
    DesignTemplate: client.createEntity('DesignTemplate'),
    HomeDesign: client.createEntity('HomeDesign'),
    ModuleEntry: client.createEntity('ModuleEntry'),
    WallEntry: client.createEntity('WallEntry'),
    FloorPlanImage: client.createEntity('FloorPlanImage'),
    WallImage: client.createEntity('WallImage'),
    DeletedModule: client.createEntity('DeletedModule'),
    DeletedWall: client.createEntity('DeletedWall'),
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        return await client.uploadFile(file);
      },
    },
  },
};

// For backwards compatibility with base44 import
export const base44 = connectapodAPI;
