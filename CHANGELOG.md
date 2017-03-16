# Change Log

## [Unreleased]

## RELEASE 1.0.3 - 2017-03-16
### Added
- Enums - Support Enums in subdocuments.

### Fixed
- Record Getter - Prevent an unexpected error if the record does not exist.

## RELEASE 1.0.2 - 2017-02-23
### Fixed
- HasMany - Fix the list of hasMany when IDs are Strings and not ObjectIds.

## RELEASE 1.0.1 - 2017-02-13
### Added
- Collections - Add includedModels & excludedModels options to choose which collections to display in Forest.

## RELEASE 1.0.0 - 2016-02-06
### Added
- Smart Actions - Support file download.

## RELEASE 0.3.3 - 2016-01-09
### Changed
- Smart field - Ensure a hasMany smart field doesn't trigger any error when the route is not yet implemented.

## RELEASE 0.3.2 - 2016-01-04
### Added
- Configurations - Users can specify the directory for Forest Smart Implementation.

### Fixed
- Configuration - Fix bad authentication when a custom path is configured.

## RELEASE 0.3.1 - 2016-12-13
### Fixed
- Record Updates - Fix record updates for apps using MongoDB 2.X.
- Embedded fields - Fix the record detail display of the embedded Enum type fields.

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
