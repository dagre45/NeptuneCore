// The following and members pages for a group.

import type { PageServerLoad } from "./$types"
import { prisma } from "$lib/server/prisma"
import { roQuery } from "$lib/server/redis"
import { error } from "@sveltejs/kit"

export const load: PageServerLoad = async ({ params }) => {
	console.time("group members")

	const group = await prisma.group.findUnique({
		where: {
			name: params.name,
		},
		select: {
			name: true,
		},
	})
	if (group) {
		const query = {
			params: {
				group: params.name,
			},
		}

		async function Users() {
			const usersQuery = await roQuery(
				`
					MATCH (:Group { name: $group }) <-[r:in]- (u:User)
					RETURN u.name AS name
				`,
				query,
				false,
				true
			)

			let users: any[] = []

			for (let i of usersQuery || ([] as any)) {
				if (i.name)
					users.push(
						await prisma.user.findUnique({
							where: {
								username: i.name,
							},
							select: {
								number: true,
								username: true,
								username: true,
								image: true,
								status: true,
							},
						})
					)
			}

			return users
		}

		console.timeEnd("group members")
		return {
			name: group.name,
			users: Users(),
			number: roQuery("RETURN SIZE((:Group { name: $group }) <-[:in]- (:User))", query, true),
		}
	} else {
		throw error(404, `Not found`)
	}
}
