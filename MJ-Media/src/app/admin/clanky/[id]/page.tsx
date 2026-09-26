import { notFound } from "next/navigation";
import { getById, listCategories, listMedia } from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { ArticleEditor, ArticleSideForms } from "@/components/admin/ArticleEditor";

export default async function EditArticlePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ulozeno?: string }> }) {
  const { id } = await params;
  const { ulozeno } = await searchParams;
  const article = getById(Number(id));
  if (!article) notFound();
  const settings = getSettings();
  return (
    <>
      <ArticleEditor article={article} categories={listCategories()} media={listMedia()} defaultAuthor={settings.author_name} justCreated={ulozeno === "1"} />
      <ArticleSideForms id={article.id} />
    </>
  );
}
