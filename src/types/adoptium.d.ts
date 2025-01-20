type adoptArch = 'x64' | 'x86' | 'x32' | 'ppc64' | 'ppc64le' | 's390x' | 'aarch64' | 'arm' | 'sparcv9' | 'riscv64' | 'loong64'
type adoptOS = 'linux' | 'windows' | 'mac' | 'solaris' | 'aix' | 'alpine-linux'
type adoptImage = 'jdk' | 'jre' | 'testimage' | 'debugimage' | 'staticlibs' | 'sources' | 'sbom'

type adoptBinaryAssetView = {
  release_name: string,
  release_link: string,
  binary: {
    os: adoptOS,
    architecture: adoptArch,
    image_type: adoptImage,
    package: {
      name: string,
      link: string,
      checksum: string | null
    }
  },
  version: {
    semver: string
  }
}