import {getPaperBuilds} from "../src/api/papermc";

let latestPaperBuild: PaperBuild;

describe('Test PaperMC API', () => {
  test('Test getting paper builds', async () => {
    const builds = await getPaperBuilds('1.21')

    expect(builds).toBeDefined()
    expect(builds).not.toBeNull()

    if (!Array.isArray(builds)) return

    expect(builds?.length).toBeGreaterThan(0)
    expect(builds[0].downloads).toBeDefined()

    latestPaperBuild = builds[0]
  })

  test('Test getting singular paper build', async () => {
    const builds = await getPaperBuilds('1.21', latestPaperBuild.build)

    expect(builds).toBeDefined()
    expect(builds).not.toBeNull()

    if (!Array.isArray(builds)) return

    const [build] = builds

    expect(build).toBeDefined()
    expect(build).not.toBeNull()

    if (!build) return

    expect(build?.downloads).toBeDefined()
  })
})