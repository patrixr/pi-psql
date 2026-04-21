## [2.0.9](https://github.com/patrixr/pi-psql/compare/v2.0.8...v2.0.9) (2026-04-21)


### Bug Fixes

* update error messages to reference launch-connection-manager.js instead of deprecated cli.js ([0a1f19b](https://github.com/patrixr/pi-psql/commit/0a1f19b8dfb2272eb564eaabfad19f813128bf2e))

## [2.0.8](https://github.com/patrixr/pi-psql/compare/v2.0.7...v2.0.8) (2026-04-21)


### Bug Fixes

* remove npm token from pipeline ([bec4845](https://github.com/patrixr/pi-psql/commit/bec484535f4f7ae77c6c46d7a69238e15c07ba0e))

## [2.0.7](https://github.com/patrixr/pi-psql/compare/v2.0.6...v2.0.7) (2026-04-21)


### Bug Fixes

* remove npm update from pipeline ([dc5a217](https://github.com/patrixr/pi-psql/commit/dc5a217d7698fc2ca203252ed8a43f2b4753fb2b))

## [2.0.6](https://github.com/patrixr/pi-psql/compare/v2.0.5...v2.0.6) (2026-04-21)


### Bug Fixes

* use Node.js 24 for better npm provenance support ([1daa48b](https://github.com/patrixr/pi-psql/commit/1daa48b506d59f4bf3a9b7b9745e504caf105b98))

## [2.0.5](https://github.com/patrixr/pi-psql/compare/v2.0.4...v2.0.5) (2026-04-21)


### Bug Fixes

* add publishConfig and NPM_CONFIG_PROVENANCE env var ([04b4bef](https://github.com/patrixr/pi-psql/commit/04b4bef8de9f7ad749fa9ce6a4da10ba79cb7e38))

## [2.0.4](https://github.com/patrixr/pi-psql/compare/v2.0.3...v2.0.4) (2026-04-21)


### Bug Fixes

* remove NPM_TOKEN, use OIDC Trusted Publishing only ([a0628f7](https://github.com/patrixr/pi-psql/commit/a0628f72fe5752df3ad28f2b014cb347921b8776))

## [2.0.3](https://github.com/patrixr/pi-psql/compare/v2.0.2...v2.0.3) (2026-04-21)


### Bug Fixes

* trigger publish workflow on release event ([0a0ad13](https://github.com/patrixr/pi-psql/commit/0a0ad13ad2d35efe8776438e0c13003af18e493f))

## [2.0.2](https://github.com/patrixr/pi-psql/compare/v2.0.1...v2.0.2) (2026-04-21)


### Bug Fixes

* use GH_PAT to trigger publish workflow on tag creation ([27dbd22](https://github.com/patrixr/pi-psql/commit/27dbd220de0acf0f206d158c95119c4e20762afc))

## [2.0.1](https://github.com/patrixr/pi-psql/compare/v2.0.0...v2.0.1) (2026-04-21)


### Bug Fixes

* test publish workflow trigger on tag creation ([648a004](https://github.com/patrixr/pi-psql/commit/648a0046f04acf30bb7fffd2dedda8c29f1c0c4f))

# [2.0.0](https://github.com/patrixr/pi-psql/compare/v1.1.0...v2.0.0) (2026-04-21)


### Code Refactoring

* separate semantic-release and npm publish workflows ([66b8c90](https://github.com/patrixr/pi-psql/commit/66b8c906590467199fd93d879c91794fa63e3896))


### BREAKING CHANGES

* Workflow now operates in two stages:
1. semantic-release (on push) - analyzes commits, creates tag, updates CHANGELOG
2. publish (on tag) - publishes to npm

This provides cleaner separation and allows tag-triggered publishing.

# [1.1.0](https://github.com/patrixr/pi-psql/compare/v1.0.0...v1.1.0) (2026-04-21)


### Features

* enable semantic-release automation ([6eaf150](https://github.com/patrixr/pi-psql/commit/6eaf1507f2f12314dede92a388c9578fc586cad8))

# 1.0.0 (2026-04-20)


### Bug Fixes

* update workflow to use Node.js 22 for semantic-release ([3b00653](https://github.com/patrixr/pi-psql/commit/3b006532f2b92823fed3d3258c240185ff16f9c2))


### Features

* add semantic-release for automated versioning ([a8338d0](https://github.com/patrixr/pi-psql/commit/a8338d01a8d44f2c854886c5bdcbfa71fedf7cc7))
* improve error messages for better debugging ([c1bb0b1](https://github.com/patrixr/pi-psql/commit/c1bb0b18f162178f1e3cffc9659521fb242adf63))


### BREAKING CHANGES

* Publishing process now uses conventional commits instead of manual versioning. Contributors must use conventional commit format (feat:, fix:, etc.) for releases to be triggered automatically.

# 1.0.0 (2026-04-20)


### Bug Fixes

* update workflow to use Node.js 22 for semantic-release ([3b00653](https://github.com/patrixr/pi-psql/commit/3b006532f2b92823fed3d3258c240185ff16f9c2))


### Features

* add semantic-release for automated versioning ([a8338d0](https://github.com/patrixr/pi-psql/commit/a8338d01a8d44f2c854886c5bdcbfa71fedf7cc7))


### BREAKING CHANGES

* Publishing process now uses conventional commits instead of manual versioning. Contributors must use conventional commit format (feat:, fix:, etc.) for releases to be triggered automatically.
