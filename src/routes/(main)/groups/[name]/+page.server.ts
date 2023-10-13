import surql from "$lib/surrealtag"
import { authorise } from "$lib/server/lucia"
import { query } from "$lib/server/surreal"
import formData from "$lib/server/formData"
import { error, fail } from "@sveltejs/kit"

export async function load({ locals, params }) {
	const { user } = await authorise(locals),
		group = (
			await query<{
				in: boolean
				memberCount: number
				name: string
				owner: {
					number: number
					username: string
				}
				places: any[]
				feed: any[]
			}>(
				surql`
					SELECT
						name,
						(SELECT
							number,
							username
						FROM <-owns<-user)[0] AS owner,
						count(<-member) AS memberCount,
						$user ∈ <-member<-user.id AS in,
						[] AS places,
						[] AS feed
					FROM group WHERE string::lowercase(name)
						= string::lowercase($name)`,
				{
					user: `user:${user.id}`,
					...params,
				},
			)
		)[0]

	if (!group) throw error(404, "Not found")

	return group
}

export const actions = {
	default: async ({ request, locals, params }) => {
		const { user } = await authorise(locals),
			group = (
				await query<{
					id: string
					name: string
				}>(
					surql`
						SELECT id, name FROM group
						WHERE string::lowercase(name)
							= string::lowercase($name)`,
					{ ...params },
				)
			)[0]

		if (!group) return fail(400, { msg: "User not found" })

		const data = await formData(request),
			{ action } = data
		const qParams = {
			user: `user:${user.id}`,
			group: group.id,
		}

		switch (action) {
			case "join":
				await query(
					surql`
						RELATE $user->member->$group
							SET time = time::now()`,
					qParams,
				)
				break
			case "leave":
				await query(
					surql`DELETE $user->member WHERE out = $group`,
					qParams,
				)
		}
	},
}
