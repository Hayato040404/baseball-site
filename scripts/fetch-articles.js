// Node.js 18+ では fetch がグローバルに利用可能
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const articlesDir = path.join(__dirname, '../articles');

// 記事を保存するディレクトリを作成
if (!fs.existsSync(articlesDir)) {
  fs.mkdirSync(articlesDir, { recursive: true });
}

/**
 * HTTPリクエストを実行（User-Agentを設定）
 */
async function fetchWithUA(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`  ❌ リクエスト失敗: ${error.message}`);
    return null;
  }
}

/**
 * ベイスターズ公式サイトからニュースを取得
 */
async function fetchBaystarNews() {
  try {
    console.log('📰 ベイスターズ公式サイトからニュースを取得中...');
    const html = await fetchWithUA('https://www.baystars.co.jp/news/');
    if (!html) return [];

    const $ = cheerio.load(html);
    const articles = [];
    
    // ニュース記事を抽出
    $('a').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      
      if (href && text && href.includes('/news/') && text.length > 5 && text.length < 200) {
        const fullUrl = href.startsWith('http') ? href : `https://www.baystars.co.jp${href}`;
        
        articles.push({
          title: text.substring(0, 150),
          url: fullUrl,
          source: 'ベイスターズ公式',
          fetchedAt: new Date().toISOString()
        });
      }
    });

    // 重複を削除
    const unique = Array.from(new Map(articles.map(a => [a.title, a])).values());
    console.log(`  ✅ ${unique.length}件を取得`);
    return unique.slice(0, 10);
  } catch (error) {
    console.error('❌ ベイスターズ公式サイトの取得に失敗:', error.message);
    return [];
  }
}

/**
 * Yahoo!ニュース（野球）からベイスターズ関連ニュースを取得
 */
async function fetchYahooNews() {
  try {
    console.log('📰 Yahoo!ニュースからベイスターズ関連ニュースを取得中...');
    const html = await fetchWithUA('https://baseball.yahoo.co.jp/npb/teams/3/');
    if (!html) return [];

    const $ = cheerio.load(html);
    const articles = [];
    
    // ニュース記事を抽出
    $('a[href*="npb"]').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      
      if (href && text && text.length > 5 && text.length < 200 && !text.includes('チケット')) {
        const fullUrl = href.startsWith('http') ? href : `https://baseball.yahoo.co.jp${href}`;
        
        articles.push({
          title: text.substring(0, 150),
          url: fullUrl,
          source: 'Yahoo!ニュース',
          fetchedAt: new Date().toISOString()
        });
      }
    });

    const unique = Array.from(new Map(articles.map(a => [a.title, a])).values());
    console.log(`  ✅ ${unique.length}件を取得`);
    return unique.slice(0, 10);
  } catch (error) {
    console.error('❌ Yahoo!ニュースの取得に失敗:', error.message);
    return [];
  }
}

/**
 * スポーツナビからベイスターズ関連ニュースを取得
 */
async function fetchSportsnaviNews() {
  try {
    console.log('📰 スポーツナビからベイスターズ関連ニュースを取得中...');
    const html = await fetchWithUA('https://sports.yahoo.co.jp/baseball/npb/teams/3/');
    if (!html) return [];

    const $ = cheerio.load(html);
    const articles = [];
    
    // ニュース記事を抽出
    $('a').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      
      if (href && text && text.length > 5 && text.length < 200 && !text.includes('チケット')) {
        const fullUrl = href.startsWith('http') ? href : `https://sports.yahoo.co.jp${href}`;
        
        articles.push({
          title: text.substring(0, 150),
          url: fullUrl,
          source: 'スポーツナビ',
          fetchedAt: new Date().toISOString()
        });
      }
    });

    const unique = Array.from(new Map(articles.map(a => [a.title, a])).values());
    console.log(`  ✅ ${unique.length}件を取得`);
    return unique.slice(0, 10);
  } catch (error) {
    console.error('❌ スポーツナビの取得に失敗:', error.message);
    return [];
  }
}

/**
 * Google ニュースからベイスターズ関連ニュースを取得
 */
async function fetchGoogleNews() {
  try {
    console.log('📰 Google ニュースからベイスターズ関連ニュースを取得中...');
    // Google News RSS フィード
    const html = await fetchWithUA('https://news.google.com/rss/search?q=ベイスターズ&hl=ja&gl=JP&ceid=JP:ja');
    if (!html) return [];

    const $ = cheerio.load(html);
    const articles = [];
    
    // RSS フィードから記事を抽出
    $('item').each((i, elem) => {
      const title = $(elem).find('title').text().trim();
      const link = $(elem).find('link').text().trim();
      
      if (title && link && title.length > 5 && title.length < 200) {
        articles.push({
          title: title.substring(0, 150),
          url: link,
          source: 'Google ニュース',
          fetchedAt: new Date().toISOString()
        });
      }
    });

    const unique = Array.from(new Map(articles.map(a => [a.title, a])).values());
    console.log(`  ✅ ${unique.length}件を取得`);
    return unique.slice(0, 10);
  } catch (error) {
    console.error('❌ Google ニュースの取得に失敗:', error.message);
    return [];
  }
}

/**
 * 日刊スポーツからベイスターズ関連ニュースを取得
 */
async function fetchNikkanSports() {
  try {
    console.log('📰 日刊スポーツからベイスターズ関連ニュースを取得中...');
    const html = await fetchWithUA('https://www.nikkansports.com/baseball/npb/teams/3.html');
    if (!html) return [];

    const $ = cheerio.load(html);
    const articles = [];
    
    // ニュース記事を抽出
    $('a').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      
      if (href && text && text.length > 5 && text.length < 200 && href.includes('baseball')) {
        const fullUrl = href.startsWith('http') ? href : `https://www.nikkansports.com${href}`;
        
        articles.push({
          title: text.substring(0, 150),
          url: fullUrl,
          source: '日刊スポーツ',
          fetchedAt: new Date().toISOString()
        });
      }
    });

    const unique = Array.from(new Map(articles.map(a => [a.title, a])).values());
    console.log(`  ✅ ${unique.length}件を取得`);
    return unique.slice(0, 10);
  } catch (error) {
    console.error('❌ 日刊スポーツの取得に失敗:', error.message);
    return [];
  }
}

/**
 * 毎日新聞からベイスターズ関連ニュースを取得
 */
async function fetchMainichiNews() {
  try {
    console.log('📰 毎日新聞からベイスターズ関連ニュースを取得中...');
    // 毎日新聞の野球セクション
    const html = await fetchWithUA('https://mainichi.jp/sports/articles/?category=baseball');
    if (!html) return [];

    const $ = cheerio.load(html);
    const articles = [];
    
    // ニュース記事を抽出
    $('a').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      
      if (href && text && text.includes('ベイスターズ') && text.length > 5 && text.length < 200) {
        const fullUrl = href.startsWith('http') ? href : `https://mainichi.jp${href}`;
        
        articles.push({
          title: text.substring(0, 150),
          url: fullUrl,
          source: '毎日新聞',
          fetchedAt: new Date().toISOString()
        });
      }
    });

    const unique = Array.from(new Map(articles.map(a => [a.title, a])).values());
    console.log(`  ✅ ${unique.length}件を取得`);
    return unique.slice(0, 10);
  } catch (error) {
    console.error('❌ 毎日新聞の取得に失敗:', error.message);
    return [];
  }
}

/**
 * すべてのソースから記事を取得
 */
async function fetchAllArticles() {
  console.log('🔄 複数のソースからベイスターズ情報を収集中...\n');
  
  const allArticles = [];
  
  // 並列で複数のソースから取得
  const results = await Promise.allSettled([
    fetchBaystarNews(),
    fetchYahooNews(),
    fetchSportsnaviNews(),
    fetchGoogleNews(),
    fetchNikkanSports(),
    fetchMainichiNews()
  ]);

  // 成功した結果のみを集約
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      allArticles.push(...result.value);
    }
  });

  // 重複を削除（タイトルで判定）
  const uniqueArticles = Array.from(
    new Map(allArticles.map(item => [item.title.trim(), item])).values()
  );

  // 日付でソート（新しい順）
  uniqueArticles.sort((a, b) => {
    const dateA = new Date(a.fetchedAt);
    const dateB = new Date(b.fetchedAt);
    return dateB - dateA;
  });

  // JSONファイルとして保存
  const outputPath = path.join(articlesDir, 'raw-articles.json');
  fs.writeFileSync(outputPath, JSON.stringify(uniqueArticles, null, 2));

  console.log(`\n✅ 合計 ${uniqueArticles.length} 件の記事を取得しました`);
  console.log(`📁 保存先: ${outputPath}\n`);

  // ソース別の統計を表示
  const sourceStats = {};
  uniqueArticles.forEach(article => {
    sourceStats[article.source] = (sourceStats[article.source] || 0) + 1;
  });

  console.log('📊 ソース別の記事数:');
  Object.entries(sourceStats).forEach(([source, count]) => {
    console.log(`  - ${source}: ${count}件`);
  });
  console.log();

  return uniqueArticles;
}

// メイン処理
fetchAllArticles().catch(error => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});

