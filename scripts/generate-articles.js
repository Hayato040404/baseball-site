import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const articlesDir = path.join(__dirname, '../articles');
const postsDir = path.join(__dirname, '../posts');

// ディレクトリを作成
if (!fs.existsSync(articlesDir)) {
  fs.mkdirSync(articlesDir, { recursive: true });
}
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true });
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Gemini API キーの確認
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ エラー: GEMINI_API_KEY が設定されていません');
  process.exit(1);
}

/**
 * 利用可能なモデルを取得
 */
async function getAvailableModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('モデル一覧の取得に失敗:', error.message);
    return [];
  }
}

/**
 * Gemini APIを使用して記事を生成
 */
async function generateArticleWithGemini(newsItem) {
  try {
    // 複数のモデルを試す
    const models = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    let model = null;
    let lastError = null;

    for (const modelName of models) {
      try {
        model = genAI.getGenerativeModel({ model: modelName });
        const testResult = await model.generateContent('テスト');
        console.log(`  ✓ モデル ${modelName} が利用可能`);
        break;
      } catch (error) {
        lastError = error;
        continue;
      }
    }

    if (!model) {
      throw lastError || new Error('利用可能なモデルが見つかりません');
    }

    const prompt = `
以下のベイスターズ関連のニュース情報をもとに、ブログ記事を作成してください。

ニュースタイトル: ${newsItem.title}
ニュースURL: ${newsItem.url}
ソース: ${newsItem.source}

要件:
1. 日本語で、親しみやすく、ファンが楽しめる内容にしてください
2. 記事の長さは300～500文字程度
3. ベイスターズファンの視点で書いてください
4. 最後に「#ベイスターズ」「#横浜DeNA」のハッシュタグを付けてください
5. Markdown形式で、見出しや強調を適切に使用してください

記事を作成してください:
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error(`❌ 記事生成エラー (${newsItem.title}):`, error.message);
    return null;
  }
}

/**
 * デモ用の記事を生成（APIが利用できない場合のフォールバック）
 */
function generateDemoArticle(newsItem, index) {
  const demoContent = `## ${newsItem.title}

**ソース**: ${newsItem.source}  
**日付**: ${new Date().toLocaleDateString('ja-JP')}

### ニュース概要

このニュースは、ベイスターズに関する最新情報です。詳細については、以下のリンクをご確認ください。

[元の記事を読む](${newsItem.url})

### ベイスターズファンの視点

ベイスターズの活動に関する重要なニュースが報告されました。このような情報は、ファンにとって重要な関心事です。

チームの最新動向に注目しながら、今後の試合や選手の活躍を応援していきましょう。

#ベイスターズ #横浜DeNA #プロ野球`;

  return demoContent;
}

/**
 * ファイル名を安全にする
 */
function sanitizeFilename(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

/**
 * Markdownファイルを作成
 */
async function createMarkdownFile(newsItem, content, index) {
  if (!content) return null;

  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-${index}-${sanitizeFilename(newsItem.title)}.md`;
  const filepath = path.join(articlesDir, filename);

  const frontmatter = `---
title: "${newsItem.title}"
date: "${date}"
category: "ベイスターズニュース"
source: "${newsItem.source}"
sourceUrl: "${newsItem.url}"
author: "AI記事生成"
---

`;

  const markdown = frontmatter + content;

  fs.writeFileSync(filepath, markdown);
  console.log(`✅ 記事を生成しました: ${filename}`);

  return {
    title: newsItem.title,
    date: date,
    filename: filename,
    filepath: filepath
  };
}

/**
 * 記事インデックスを更新
 */
function updateArticleIndex(articles) {
  const indexPath = path.join(articlesDir, 'index.json');
  
  let index = [];
  if (fs.existsSync(indexPath)) {
    const existing = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    index = Array.isArray(existing) ? existing : [];
  }

  // 新しい記事を追加
  const newIndex = [...articles, ...index].slice(0, 100); // 最新100件を保持

  fs.writeFileSync(indexPath, JSON.stringify(newIndex, null, 2));
  console.log(`\n📋 記事インデックスを更新しました (${newIndex.length}件)`);
}

/**
 * メイン処理
 */
async function generateAllArticles() {
  console.log('🤖 Gemini APIを使用して記事を生成中...\n');

  const rawArticlesPath = path.join(articlesDir, 'raw-articles.json');
  
  if (!fs.existsSync(rawArticlesPath)) {
    console.log('❌ raw-articles.json が見つかりません。先に fetch-articles.js を実行してください。');
    process.exit(1);
  }

  const rawArticles = JSON.parse(fs.readFileSync(rawArticlesPath, 'utf-8'));
  
  if (rawArticles.length === 0) {
    console.log('⚠️  記事がありません。');
    process.exit(0);
  }

  const generatedArticles = [];
  let apiAvailable = true;

  for (let i = 0; i < rawArticles.length; i++) {
    const newsItem = rawArticles[i];
    console.log(`\n📝 記事 ${i + 1}/${rawArticles.length} を生成中...`);
    console.log(`   タイトル: ${newsItem.title.substring(0, 60)}...`);

    let content;
    
    if (apiAvailable) {
      content = await generateArticleWithGemini(newsItem);
      
      // APIが利用できない場合はデモ用記事を使用
      if (!content) {
        console.log('   ⚠️  API生成に失敗。デモ用記事を使用します。');
        content = generateDemoArticle(newsItem, i + 1);
      }
    } else {
      content = generateDemoArticle(newsItem, i + 1);
    }
    
    if (content) {
      const metadata = await createMarkdownFile(newsItem, content, i + 1);
      if (metadata) {
        generatedArticles.push(metadata);
      }
    }

    // API呼び出しの制限を回避するため、少し待機
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // インデックスを更新
  updateArticleIndex(generatedArticles);

  console.log(`\n🎉 ${generatedArticles.length}件の記事を生成しました！`);
}

// メイン処理
generateAllArticles().catch(error => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});

