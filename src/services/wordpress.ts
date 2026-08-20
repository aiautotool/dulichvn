/**
 * WordPress REST API News Service
 * Handles fetching, parsing, and formatting news posts from any WordPress site.
 */

export interface WpArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  date: string;
  author: string;
  category: string;
  link: string;
  readTime: string;
}

export const DEFAULT_WP_URL = 'https://aiautotool.com';
export const DEFAULT_GOOGLE_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1SDTIcToGLww8beiHeyN71p30qVN3ZqjO6pvsJK0Nsh8/export?format=csv&gid=0';

export interface WpSheetConfig {
  siteUrl: string;
  categories: string;
}

/**
 * Fetches all WordPress site configurations dynamically from Google Sheet CSV export
 */
export async function fetchWpConfigsFromSheet(
  sheetCsvUrl: string = DEFAULT_GOOGLE_SHEET_URL
): Promise<WpSheetConfig[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(sheetCsvUrl, {
      signal: controller.signal,
      headers: { Accept: 'text/csv,*/*' },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return [{ siteUrl: DEFAULT_WP_URL, categories: 'Soft' }];
    }

    const text = await response.text();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 2) {
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const siteIdx = headers.indexOf('site');
      const catIdx = headers.indexOf('categories');

      const configs: WpSheetConfig[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const rawSite = siteIdx >= 0 ? cols[siteIdx] : cols[0];
        const rawCat = catIdx >= 0 ? cols[catIdx] : (cols[1] || '');

        if (rawSite && rawSite.trim()) {
          configs.push({
            siteUrl: normalizeWpUrl(rawSite),
            categories: rawCat || 'Tin tức',
          });
        }
      }

      if (configs.length > 0) {
        return configs;
      }
    }
  } catch (err) {
    console.warn('Unable to fetch WP configs from Google Sheet, fallback to defaults', err);
  }

  return [{ siteUrl: DEFAULT_WP_URL, categories: 'Soft' }];
}

/**
 * Single config helper for backward compatibility
 */
export async function fetchWpConfigFromSheet(
  sheetCsvUrl: string = DEFAULT_GOOGLE_SHEET_URL
): Promise<WpSheetConfig> {
  const configs = await fetchWpConfigsFromSheet(sheetCsvUrl);
  return configs[0] || { siteUrl: DEFAULT_WP_URL, categories: 'Soft' };
}

/**
 * Strips HTML tags and decodes common HTML entities for clean text display
 */
export function cleanHtmlText(rawHtml?: string): string {
  if (!rawHtml) return '';
  return rawHtml
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Format ISO date into DD/MM/YYYY string
 */
export function formatWpDate(isoDateStr: string): string {
  try {
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return isoDateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoDateStr;
  }
}

/**
 * Estimate reading time based on word count
 */
export function calculateReadTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} phút đọc`;
}

/**
 * Fallback news dataset to ensure smooth presentation if offline or loading fails
 */
export const FALLBACK_ARTICLES: WpArticle[] = [
  {
    id: 'fb-1',
    title: 'A Practical 10-Step Workflow for Publishing With AI Auto Tool',
    excerpt: 'Khám phá quy trình 10 bước tự động hóa biên tập nội dung, tối ưu SEO và xuất bản bài viết chất lượng cao từ WordPress.',
    content: 'AI Auto Tool cung cấp giải pháp tự động hóa nội dung toàn diện cho các blog và trang web tin tức WordPress. Với công nghệ xử lý ngôn ngữ tự nhiên hiện đại, bạn có thể tạo nội dung chuẩn SEO, tối ưu hình ảnh và đăng bài tự động.',
    imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80',
    date: '06/06/2026',
    author: 'AI Auto Tool',
    category: 'Mẹo Công Nghệ',
    link: 'https://aiautotool.com/',
    readTime: '3 phút đọc',
  },
  {
    id: 'fb-2',
    title: 'Top 10 địa điểm du lịch trải nghiệm không thể bỏ qua tại Việt Nam',
    excerpt: 'Hành trình từ Vịnh Hạ Long huyền bí đến những cung đường đèo hùng vĩ tại Hà Giang dành cho tín đồ xê dịch.',
    content: 'Việt Nam sở hữu vô số danh lam thắng cảnh làm say đắm lòng người. Từ những bãi biển xanh ngắt ở Phú Quốc cho đến các di tích lịch sử đượm màu thời gian tại Cố đô Huế.',
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
    date: '15/08/2026',
    author: 'Vinago+ Editorial',
    category: 'Cẩm Nang Du Lịch',
    link: 'https://aiautotool.com/',
    readTime: '4 phút đọc',
  },
  {
    id: 'fb-3',
    title: 'Khám phá ẩm thực đường phố Hà Nội: Món ngon chuẩn vị 36 phố phường',
    excerpt: 'Thưởng thức bún chả, phở gia truyền và cà phê trứng béo ngậy giữa lòng thủ đô ngàn năm văn hiến.',
    content: 'Ẩm thực Hà Nội luôn là điểm hấp dẫn đặc biệt đối với du khách trong và ngoài nước. Mỗi món ăn đều mang hương vị tinh tế, đặc trưng riêng của văn hóa Tràng An.',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
    date: '18/08/2026',
    author: 'Food Guide',
    category: 'Ẩm Thực',
    link: 'https://aiautotool.com/',
    readTime: '5 phút đọc',
  },
];

/**
 * Normalizes WordPress site URL
 */
export function normalizeWpUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (!url) return DEFAULT_WP_URL;
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  return url.replace(/\/+$/, '');
}

/**
 * Fetch articles from WordPress REST API with page pagination
 */
export async function fetchWordPressPosts(
  rawSiteUrl?: string,
  limit: number = 8,
  categoryFilter?: string,
  page: number = 1
): Promise<{ articles: WpArticle[]; siteUrl: string; category?: string; error?: string; hasMore?: boolean }> {
  const siteUrl = normalizeWpUrl(rawSiteUrl || DEFAULT_WP_URL);

  // Attempt to resolve category ID if categoryFilter is specified
  let categoryId: number | null = null;
  if (categoryFilter && categoryFilter.trim()) {
    try {
      const catApi = `${siteUrl}/wp-json/wp/v2/categories?search=${encodeURIComponent(categoryFilter.trim())}`;
      const catRes = await fetch(catApi, { headers: { Accept: 'application/json' } });
      if (catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData) && catData.length > 0) {
          categoryId = catData[0].id;
        }
      }
    } catch {
      // Ignore category search errors and fallback to general posts query
    }
  }

  let apiEndpoint = `${siteUrl}/wp-json/wp/v2/posts?_embed=1&per_page=${limit}&page=${page}`;
  if (categoryId !== null) {
    apiEndpoint += `&categories=${categoryId}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(apiEndpoint, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // If page > 1 failed, return empty array without fallback to avoid duplicating fallback articles
      if (page > 1) {
        return { articles: [], siteUrl, category: categoryFilter, hasMore: false };
      }
      return {
        articles: FALLBACK_ARTICLES,
        siteUrl,
        category: categoryFilter,
        hasMore: false,
        error: `Máy chủ phản hồi mã ${response.status}`,
      };
    }

    const totalPagesHeader = response.headers.get('X-WP-TotalPages');
    const totalPages = totalPagesHeader ? parseInt(totalPagesHeader, 10) : 1;
    const hasMore = page < totalPages;

    const rawPosts = await response.json();
    if (!Array.isArray(rawPosts) || rawPosts.length === 0) {
      if (categoryId !== null && page === 1) {
        return fetchWordPressPosts(siteUrl, limit, undefined, page);
      }
      return {
        articles: page === 1 ? FALLBACK_ARTICLES : [],
        siteUrl,
        category: categoryFilter,
        hasMore: false,
        error: page === 1 ? 'Chưa tìm thấy bài viết nào trên trang.' : undefined,
      };
    }

    const parsedArticles: WpArticle[] = rawPosts.map((post: any) => {
      const titleClean = cleanHtmlText(post.title?.rendered) || 'Bài viết mới';
      const excerptClean = cleanHtmlText(post.excerpt?.rendered || post.content?.rendered) || 'Nhấn để xem chi tiết bài viết...';
      const contentClean = cleanHtmlText(post.content?.rendered) || excerptClean;

      // Extract image URL from _embedded featured media
      let imageUrl = '';
      const media = post._embedded?.['wp:featuredmedia']?.[0];
      if (media) {
        imageUrl =
          media.media_details?.sizes?.medium_large?.source_url ||
          media.media_details?.sizes?.full?.source_url ||
          media.source_url ||
          '';
      }

      // Fallback image if missing
      if (!imageUrl) {
        imageUrl = 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80';
      }

      // Extract category term
      let category = categoryFilter || 'Tin tức';
      const terms = post._embedded?.['wp:term'];
      if (Array.isArray(terms) && terms.length > 0 && Array.isArray(terms[0]) && terms[0].length > 0) {
        category = cleanHtmlText(terms[0][0]?.name) || category;
      }

      // Extract author
      let author = 'WordPress';
      const authorObj = post._embedded?.author?.[0];
      if (authorObj?.name) {
        author = cleanHtmlText(authorObj.name);
      }

      return {
        id: `${siteUrl}-${post.id}`,
        title: titleClean,
        excerpt: excerptClean.slice(0, 160) + (excerptClean.length > 160 ? '...' : ''),
        content: contentClean,
        imageUrl,
        date: formatWpDate(post.date || new Date().toISOString()),
        author,
        category,
        link: post.link || siteUrl,
        readTime: calculateReadTime(contentClean),
      };
    });

    return {
      articles: parsedArticles,
      siteUrl,
      category: categoryFilter,
      hasMore: hasMore || rawPosts.length === limit,
    };
  } catch (err: any) {
    const errMsg = err?.name === 'AbortError' ? 'Quá thời gian kết nối (timeout)' : 'Không thể kết nối đến máy chủ';
    return {
      articles: page === 1 ? FALLBACK_ARTICLES : [],
      siteUrl,
      category: categoryFilter,
      hasMore: false,
      error: page === 1 ? errMsg : undefined,
    };
  }
}

/**
 * Fetches posts concurrently from multiple site configurations
 */
export async function fetchWordPressPostsFromConfigs(
  configs: WpSheetConfig[],
  page: number = 1,
  limitPerSite: number = 6
): Promise<{ articles: WpArticle[]; hasMore: boolean }> {
  if (!configs || configs.length === 0) {
    const res = await fetchWordPressPosts(DEFAULT_WP_URL, limitPerSite, 'Soft', page);
    return { articles: res.articles, hasMore: res.hasMore ?? false };
  }

  const results = await Promise.allSettled(
    configs.map((cfg) => fetchWordPressPosts(cfg.siteUrl, limitPerSite, cfg.categories, page))
  );

  const allArticles: WpArticle[] = [];
  let anyHasMore = false;

  for (const res of results) {
    if (res.status === 'fulfilled') {
      if (res.value.articles && res.value.articles.length > 0) {
        allArticles.push(...res.value.articles);
      }
      if (res.value.hasMore) {
        anyHasMore = true;
      }
    }
  }

  // Deduplicate articles by link
  const seen = new Set<string>();
  const uniqueArticles = allArticles.filter((art) => {
    const key = art.link || art.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    articles: uniqueArticles,
    hasMore: anyHasMore || uniqueArticles.length > 0,
  };
}

