import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'front-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const articlesDir = path.join(__dirname, '../articles');
const publicDir = path.join(__dirname, '../public');

// publicディレクトリを作成
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

/**
 * 記事ファイルを読み込んでメタデータを抽出
 */
function parseArticles() {
  const articles = [];
  
  if (!fs.existsSync(articlesDir)) {
    console.log('⚠️  articlesディレクトリが見つかりません');
    return articles;
  }

  const files = fs.readdirSync(articlesDir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse();

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(articlesDir, file), 'utf-8');
      const parsed = matter(content);
      
      articles.push({
        title: parsed.attributes.title,
        date: parsed.attributes.date,
        category: parsed.attributes.category,
        source: parsed.attributes.source,
        sourceUrl: parsed.attributes.sourceUrl,
        author: parsed.attributes.author,
        filename: file,
        excerpt: parsed.body.substring(0, 150) + '...'
      });
    } catch (error) {
      console.error(`❌ ファイル解析エラー (${file}):`, error.message);
    }
  }

  return articles;
}

/**
 * HTMLテンプレートを生成
 */
function generateHTML(articles) {
  const articlesHTML = articles.map(article => `
    <article class="article-card">
      <div class="article-header">
        <h2><a href="articles/${article.filename.replace('.md', '.html')}">${article.title}</a></h2>
        <div class="article-meta">
          <span class="date">${article.date}</span>
          <span class="category">${article.category}</span>
          <span class="source">${article.source}</span>
        </div>
      </div>
      <p class="excerpt">${article.excerpt}</p>
      <a href="articles/${article.filename.replace('.md', '.html')}" class="read-more">続きを読む →</a>
    </article>
  `).join('\n');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ベイスターズ自動情報サイト</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
    }

    header {
      background: linear-gradient(135deg, #003DA5 0%, #0052CC 100%);
      color: white;
      padding: 2rem 1rem;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 61, 165, 0.3);
    }

    header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      font-weight: 700;
    }

    header p {
      font-size: 1.1rem;
      opacity: 0.95;
    }

    .logo {
      display: inline-block;
      width: 60px;
      height: 60px;
      background: white;
      border-radius: 50%;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #003DA5;
      font-size: 1.5rem;
    }

    nav {
      background: #003DA5;
      padding: 1rem;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    nav ul {
      list-style: none;
      display: flex;
      justify-content: center;
      gap: 2rem;
      flex-wrap: wrap;
      max-width: 1200px;
      margin: 0 auto;
    }

    nav a {
      color: white;
      text-decoration: none;
      font-weight: 500;
      transition: opacity 0.3s;
    }

    nav a:hover {
      opacity: 0.8;
    }

    main {
      max-width: 1000px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .articles-container {
      display: grid;
      gap: 2rem;
    }

    .article-card {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s, box-shadow 0.3s;
      border-left: 4px solid #003DA5;
    }

    .article-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 61, 165, 0.2);
    }

    .article-header {
      margin-bottom: 1rem;
    }

    .article-header h2 {
      margin-bottom: 0.5rem;
      font-size: 1.5rem;
    }

    .article-header h2 a {
      color: #003DA5;
      text-decoration: none;
      transition: color 0.3s;
    }

    .article-header h2 a:hover {
      color: #0052CC;
    }

    .article-meta {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      font-size: 0.9rem;
      color: #666;
    }

    .article-meta span {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #f0f4f8;
      border-radius: 4px;
    }

    .article-meta .date {
      background: #e3f2fd;
      color: #003DA5;
    }

    .article-meta .category {
      background: #fff3e0;
      color: #f57c00;
    }

    .article-meta .source {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .excerpt {
      color: #555;
      margin-bottom: 1rem;
      line-height: 1.8;
    }

    .read-more {
      display: inline-block;
      color: #003DA5;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s;
    }

    .read-more:hover {
      color: #0052CC;
    }

    footer {
      background: #003DA5;
      color: white;
      text-align: center;
      padding: 2rem 1rem;
      margin-top: 4rem;
    }

    footer p {
      margin: 0.5rem 0;
    }

    .update-time {
      font-size: 0.9rem;
      color: #bbb;
    }

    @media (max-width: 768px) {
      header h1 {
        font-size: 1.8rem;
      }

      nav ul {
        gap: 1rem;
      }

      .article-card {
        padding: 1.5rem;
      }

      .article-header h2 {
        font-size: 1.2rem;
      }

      .article-meta {
        font-size: 0.8rem;
      }
    }

    .no-articles {
      text-align: center;
      padding: 3rem 1rem;
      background: white;
      border-radius: 8px;
      color: #666;
    }

    .no-articles p {
      font-size: 1.1rem;
    }
  </style>
</head>
<body>
  <header>
    <div class="logo">⭐</div>
    <h1>ベイスターズ自動情報サイト</h1>
    <p>横浜DeNAベイスターズの最新情報を毎日自動配信</p>
  </header>

  <nav>
    <ul>
      <li><a href="#home">ホーム</a></li>
      <li><a href="#latest">最新記事</a></li>
      <li><a href="#about">このサイトについて</a></li>
    </ul>
  </nav>

  <main>
    <section id="latest">
      <div class="articles-container">
        ${articles.length > 0 ? articlesHTML : '<div class="no-articles"><p>記事がまだ公開されていません。</p></div>'}
      </div>
    </section>
  </main>

  <footer>
    <p>&copy; 2025 ベイスターズ自動情報サイト</p>
    <p class="update-time">最終更新: ${new Date().toLocaleString('ja-JP')}</p>
    <p style="font-size: 0.9rem; margin-top: 1rem;">このサイトはGitHub Actionsで毎日自動更新されています</p>
  </footer>
</body>
</html>`;
}

/**
 * サイトをビルド
 */
function buildSite() {
  console.log('🏗️  サイトをビルド中...\n');

  const articles = parseArticles();
  console.log(`📰 ${articles.length}件の記事を検出しました`);

  const html = generateHTML(articles);
  const indexPath = path.join(publicDir, 'index.html');
  
  fs.writeFileSync(indexPath, html);
  console.log(`✅ index.html を生成しました`);

  // 記事一覧JSONを生成
  const articlesJsonPath = path.join(publicDir, 'articles.json');
  fs.writeFileSync(articlesJsonPath, JSON.stringify(articles, null, 2));
  console.log(`✅ articles.json を生成しました`);

  console.log(`\n🎉 サイトのビルドが完了しました！`);
  console.log(`📁 出力先: ${publicDir}`);
}

// メイン処理
buildSite();

