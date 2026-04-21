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
