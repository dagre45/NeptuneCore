// This should be moved to asset thumbnails for every asset on Mercury, but for now we'll use it for the stamper tool (and other games which require it)

import { Record, equery, surql } from "$lib/server/surreal"
import { error, redirect } from "@sveltejs/kit"

export async function GET({ url }) {
	const width = +(url.searchParams.get("wd") as string)
	const height = +(url.searchParams.get("ht") as string)
	const assetId = +(url.searchParams.get("aid") as string)
	const stringAssetId = assetId.toString()

	if (!assetId || !width || !height) error(404, "Asset not found")

	const [[cache]] = await equery<{ url: string }[][]>(surql`
		SELECT url FROM ${Record("thumbnailCache", assetId)}`)
	if (cache) redirect(302, cache.url)

	const params = new URLSearchParams({
		assetIds: stringAssetId,
		returnPolicy: "Placeholder",
		size: `${width}x${height}`,
		format: "Png",
		isCircular: "false",
	})
	const thumb = await fetch(
		`https://thumbnails.roblox.com/v1/assets?${params}`
	)

	if (thumb.status !== 200) error(400, "Invalid asset")

	const { imageUrl } = JSON.parse(await thumb.text()).data[0]
	await equery(surql`UPDATE $asset SET url = ${imageUrl}`, {
		asset: Record("thumbnailCache", assetId),
	})

	redirect(302, imageUrl)
}
