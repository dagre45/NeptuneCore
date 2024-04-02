import { authorise } from "$lib/server/lucia"
import ratelimit from "$lib/server/ratelimit"
import requestRender, { RenderType } from "$lib/server/requestRender"
import { squery, query, surql } from "$lib/server/surreal"
import { error, fail } from "@sveltejs/kit"
import fs from "node:fs/promises"
import type { RequestEvent } from "./$types"

export const load = async ({ locals }) => ({
	assets: await query<{
		name: string
		price: number
		id: number
		type: string
		creator: BasicUser
		imageAsset?: {
			id: number
			name: string
		}
	}>(
		surql`
			SELECT
				meta::id(id) AS id,
				name,
				price,
				type,
				(SELECT number, status, username
				FROM <-created<-user)[0] AS creator,
				(SELECT meta::id(id) AS id, name
				FROM ->imageAsset->asset)[0] AS imageAsset
			FROM asset WHERE visibility = "Pending"
				AND type INSIDE [17, 18, 2, 11, 12, 19]`,
		{ user: `user:${(await authorise(locals, 3)).user.id}` }
	),
})

async function getData({ locals, url }: RequestEvent) {
	const { user } = await authorise(locals, 3)
	const id = url.searchParams.get("id")

	if (!id) error(400, "Missing asset id")
	if (!/^\d+$/.test(id)) error(400, `Invalid asset id: ${id}`)

	const params = {
		user: `user:${user.id}`,
		asset: `asset:${id}`,
	}
	const asset = await squery<{
		name: string
	}>(surql`SELECT * FROM $asset`, params)

	if (!asset) error(404, "Asset not found")

	return { user, id, params, assetName: asset.name }
}

// it goes like this, the bug, the fix
// the pull request, the git commit
// the coder's late-night screams
// of hallelujah
export const actions: import("./$types").Actions = {}
actions.approve = async e => {
	const { id, params, assetName } = await getData(e)
	await squery(
		surql`
			UPDATE $asset SET visibility = "Visible";
			UPDATE $asset->imageAsset->asset SET visibility = "Visible";
			CREATE auditLog CONTENT {
				action: "Moderation",
				note: $note,
				user: $user,
				time: time::now()
			}`,
		{
			...params,
			note: `Approve asset ${assetName} (id ${id})`,
		}
	)
}
actions.deny = async e => {
	const { id, params, assetName } = await getData(e)
	await squery(
		surql`
			UPDATE $asset SET visibility = "Moderated";
			UPDATE $asset->imageAsset->asset SET visibility = "Moderated";
			CREATE auditLog CONTENT {
				action: "Moderation",
				note: $note,
				user: $user,
				time: time::now()
			}`,
		{
			...params,
			note: `Moderate asset ${assetName} (id ${id})`,
		}
	)
}
actions.rerender = async e => {
	const { id } = await getData(e)
	const limit = ratelimit(null, "rerender", e.getClientAddress, 10)
	if (limit) return limit

	try {
		await requestRender(RenderType.Clothing, +id)
	} catch (e) {
		console.error(e)
		fail(500, { msg: "Failed to request render" })
	}
}
actions.purge = async e => {
	// Nuclear option
	const { id, params, assetName } = await getData(e)
	const { iaid } = await squery<{ iaid: number }>(
		surql`
			SELECT meta::id((->imageAsset->asset.id)[0]) AS iaid
			FROM $asset`,
		{ asset: `asset:${id}` }
	)

	await Promise.all([
		query(
			surql`
				DELETE $asset;
				DELETE $imageAsset;
				CREATE auditLog CONTENT {
					action: "Moderation",
					note: $note,
					user: $user,
					time: time::now()
				}`,
			{
				...params,
				imageAsset: `asset:${iaid}`,
				note: `Purge asset ${assetName} (id ${id})`,
			}
		),
		fs.rm(`data/assets/${id}`),
		fs.rm(`data/assets/${iaid}`),
		fs.rm(`data/thumbnails/${id}`),
	])
}
