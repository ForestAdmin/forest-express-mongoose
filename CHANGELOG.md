# Change Log

## [Unreleased]

## RELEASE 1.1.10 - 2017-06-28
### Fixed
- Serializer - Log an error in the console if the association doesn't exist.

## RELEASE 1.1.9 - 2017-06-23
### Added
- Apimap - Send database type and orm version in apimap.

### Fixed
- Search - Fix crash on hasmany array association.

## RELEASE 1.1.8 - 2017-06-13
### Changed
- Error Messages - Display the stack trace on unexpected errors.

### Fixed
- Error Messages - Display an explicit warning if Forest servers are in maintenance.

## RELEASE 1.1.7 - 2017-06-07
### Fixed
- Records Serialization - Fix the object types case (kebab case) to prevent potential JSON api adapter errors on client side.

## RELEASE 1.1.6 - 2017-06-01
### Fixed
- HasMany Smart Fields - Fix routes conflicts between hasMany Smart Fields and other associations.

## RELEASE 1.1.5 - 2017-05-30
### Added
- Smart Collections - Add a new isSearchable property to display the search bar for Smart Collections.
- Filters - Add the not contains operator.

### Fixed
- Record Update - Trigger validations on record update.

## RELEASE 1.1.4 - 2017-05-24
### Changed
- Resources Updater - Pass the params.recordId to the ResourceUpdater.

### Fixed
- Smart Fields - Serialize Smart Fields values for hasMany associations.

## RELEASE 1.1.3 - 2017-05-16
### Fixed
- Smart Fields - Fix some bad Smart Fields getter calls on records list and detail display.

## RELEASE 1.1.2 - 2017-05-11
### Added
- Customization Errors - Do not send the apimap when users create Forest customization with syntax errors in code.
- Customization Errors - Add errors in the console when users create Forest customization with syntax errors in code.

### Fixed
- Smart Fields - Serialize Smart Fields values for belongsTo association.

## RELEASE 1.1.1 - 2017-05-04
### Added
- Smart Fields - Add an explicit error message if the search on a Smart Field generates an error.

### Fixed
- Smart Fields - A search on a collection having Smart Fields with search method implemented will respond properly (bypassing failing Smart Fields search if any).

## RELEASE 1.1.0 - 2017-04-27
### Added
- Smart Fields - Developers can now define Smart Fields setters.

### Changed
- Smart Fields - Replace the Smart Fields value method by get.

## RELEASE 1.0.8 - 2017-04-21
### Fixed
- Filters ToDate - Fix the end of period filtering for "toDate" date operator types.
- Smart Fields - Smart fields are sent in the detail view request.

## RELEASE 1.0.7 - 2017-04-14
### Added
- Setup Guide - Add integration field to the collections to distinguish Smart Collections and Collections from integrations.

## RELEASE 1.0.6 - 2017-04-06
### Added
- Version Warning - Display a warning message if the liana version used is too old.

## RELEASE 1.0.5 - 2017-03-30
### Added
- Smart Actions - Users don't have to select records to use a smart action through the global option.

## RELEASE 1.0.4 - 2017-03-27
### Added
- Search - Enable the search inside arrays of strings.

## RELEASE 1.0.3 - 2017-03-16
### Added
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

### Changed
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

### Fixed
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
