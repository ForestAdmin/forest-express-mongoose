# Change Log

## [Unreleased]
### Fixed
- Record Updates - Fix record updates for apps using MongoDB 2.X.

## RELEASE 0.3.0 - 2016-12-12
### Added
- Segments - Smart Segments can be created to define specific records subsets.

### Changed
- Package - Add contributors, keywords, homepage...
- Package - Remove all unused packages.
- Dependencies - Freeze the dependencies versions to reduce packages versions changes between projects/environments.
- Configuration - Rename secret values to envSecret and authSecret.
- Installation - envSecret and authSecret are now defined in environment variables and, thus, in all non-development environments, need to be set manually.

## RELEASE 0.2.27 - 2016-12-04
### Added
- Date Filters - Date filters operators are now based on the client timezone.

### Changed
- Packages - Remove useless node-uuid package.

### Fixed
- Line Charts - Fix per-week line charts on several years.
- Line Charts - Fix the bad month displayed in the per-month line charts.
- Value Charts - Format Pie charts value properly for groupBy on Date type field.

## RELEASE 0.2.26 - 2016-11-04
### Changed
- Packages - Fix several issues updating the forest-express package to the latest version.

## RELEASE 0.2.25 - 2016-11-04
### Fixed
- Filters - Fix records retrieval with a single association filter.

## RELEASE 0.2.24 - 2016-10-28
### Changed
- Filters - Add the new date filters protocol.

## RELEASE 0.2.23 - 2016-10-14
### Added
- Smart field - Enable search on smart fields.

## RELEASE 0.2.22 - 2016-10-12
### Fixed
- ES5 - Fix remaining ES5 incompatible syntax.

## RELEASE 0.2.21 - 2016-10-11
### Fixed
- ES5 - Fix and secure the ES5 compatibility with a git hook.

## RELEASE 0.2.20 - 2016-09-30
### Added
- Filters - Users want the OR filter operator with their conditions (restricted to simple conditions).

### Fixed
- Record Update - Fix the potential dissociations on record update.
- Pagination - Fix hasMany arrays.
- Schema - support array of objects with syntax { type: String }

## RELEASE 0.2.19 - 2016-09-29
- Pagination - fix the hasMany number of records.

## RELEASE 0.2.18 - 2016-09-26
### Added
- Filters - Users want to have "From now" and "Today" operators.

### Fixed
- Code Syntax - Ensure compatibility with Node < 4.x.
