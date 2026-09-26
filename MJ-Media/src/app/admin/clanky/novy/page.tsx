import { listCategories, listMedia } from "@/lib/articles";
import { getSettings } from "@/lib/settings";
import { ArticleEditor } from "@/components/admin/ArticleEditor";

export default function NewArticlePage() {
  const settings = getSettings();
  return <ArticleEditor article={null} categories={listCategories()} media={listMedia()} defaultAuthor={settings.author_name} />;
}
