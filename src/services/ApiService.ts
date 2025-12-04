import { CONFIG } from '../constants/config';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type PostData = {
  title: string;
  content: string;
  type: 'event' | 'notification' | 'news';
  date: string;
  metadata?: Record<string, any>;
};

class ApiService {
  private baseUrl: string;
  private authToken: string;
  private timeout: number;

  constructor() {
    this.baseUrl = CONFIG.API.BASE_URL;
    this.authToken = CONFIG.API.AUTH_TOKEN;
    this.timeout = CONFIG.API.TIMEOUT;
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
          ...options.headers,
        },
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP error! status: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  }

  async createPost(postData: PostData): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}${CONFIG.API.ENDPOINTS.POSTS}`,
        {
          method: 'POST',
          body: JSON.stringify(postData),
        }
      );

      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async updatePost(postId: string, postData: Partial<PostData>): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}${CONFIG.API.ENDPOINTS.POSTS}/${postId}`,
        {
          method: 'PUT',
          body: JSON.stringify(postData),
        }
      );

      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async deletePost(postId: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}${CONFIG.API.ENDPOINTS.POSTS}/${postId}`,
        {
          method: 'DELETE',
        }
      );

      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getPosts(type?: string): Promise<ApiResponse<any[]>> {
    try {
      const queryParams = type ? `?type=${type}` : '';
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}${CONFIG.API.ENDPOINTS.POSTS}${queryParams}`
      );

      return this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}

export default new ApiService(); 