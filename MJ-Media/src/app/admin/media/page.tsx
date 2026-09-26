import { listMedia } from "@/lib/articles";
import { deleteMediaAction, updateMediaAltAction } from "@/actions/media";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { CopyButton } from "@/components/admin/CopyButton";
import { formatShort } from "@/lib/format";

function size(n: number) {
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} kB`;
}

export default function MediaPage() {
  const media = listMedia();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Média</h1>
          <p className="hint">{media.length} souborů · JPG, PNG, WebP, GIF, SVG, AVIF do 12 MB</p>
        </div>
      </div>
      <MediaUploader />
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {media.map((m) => (
          <div key={m.id} className="card overflow-hidden flex flex-col">
            <div className="aspect-[4/3] bg-wash">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/uploads/${m.filename}`} alt={m.alt} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-3 space-y-2 text-xs">
              <p className="font-medium truncate" title={m.original_name}>{m.original_name}</p>
              <p className="hint">{size(m.size)} · {formatShort(m.created_at)}</p>
              <form action={updateMediaAltAction} className="flex gap-1">
                <input type="hidden" name="id" value={m.id} />
                <input name="alt" defaultValue={m.alt} placeholder="Popis (alt)" className="field py-1 text-xs" />
                <button className="btn btn-ghost btn-sm" type="submit">OK</button>
              </form>
              <div className="flex items-center justify-between gap-1">
                <CopyButton text={`/uploads/${m.filename}`} />
                <form action={deleteMediaAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <ConfirmButton message="Smazat soubor? Články, které ho používají, přijdou o obrázek.">Smazat</ConfirmButton>
                </form>
              </div>
            </div>
          </div>
        ))}
        {media.length === 0 && <p className="col-span-full text-center text-sm text-muted py-10">Knihovna je prázdná. Nahrajte první obrázek.</p>}
      </div>
    </div>
  );
}
