# Change Log

## [Unreleased]

## RELEASE 2.11.1 - 2018-07-11
### Fixed
- Mixpanel Integration - Only retrieve events that are less than 60 days old to be compliant with the Mixpanel's API.

## RELEASE 2.11.0 - 2018-07-10
### Added
- Mixpanel Integration - Change the integration to display the last 100 Mixpanel events of a "user" record.
- Mixpanel Integration - Remove the Mixpanel integration pre-defined segments.

## RELEASE 2.10.3 - 2018-06-27
### Changed
- Intercom Integration - Display the Intercom error in the server logs if the conversations list retrieval fails.

### Fixed
- Intercom Integration - Users can now access to the Intercom Details page.
- Intercom Integration - Fix the integration routes for projects using the "expressParentApp" configuration.

## RELEASE 2.10.2 - 2018-06-21
### Fixed
- Permissions - Fix automated permission for projects having multiple teams.

## RELEASE 2.10.1 - 2018-06-07
### Fixed
- IP Whitelist - Fix broken ip range of form 'x.x.x.x - x.x.x.x'.

## RELEASE 2.10.0 - 2018-05-31
### Added
- Permissions - Add a permission mechanism to protect the data accordingly to the UI configuration.

### Fixed
- Smart Actions - Fix form values prefill on Smart Actions having a custom endpoint.

## RELEASE 2.9.0 - 2018-05-27
### Added
- Search - Display highlighted matches on table view when searching.

### Changed
- Technical - Switch the linter to eslint.
- Technical - Save exact dependencies version.

### Fixed
- Technical - Use local packages for npm scripts.

## RELEASE 2.8.4 - 2018-04-30
### Fixed
- Collections - Allow search fields customization before liana initialization.

## RELEASE 2.8.3 - 2018-04-25
### Fixed
- Premium Security - Handle mutli instances ip whitelist refresh.

## RELEASE 2.8.2 - 2018-04-23
### Fixed
- Apimap - Prevent an error on Apimap generation if the Mongoose ORM version is not found.

## RELEASE 2.8.1 - 2018-04-17
### Changed
- Technical - Update yarn.lock.

## RELEASE 2.8.0 - 2018-04-17
### Added
- Premium Security - Add IP Whitelist feature.

## RELEASE 2.7.1 - 2018-04-12
### Fixed
- Smart Relationships - Make the Smart BelongsTo work when it references a Smart Collection record.

## RELEASE 2.7.0 - 2018-04-03
### Added
- Related Data - Delete records directly from a hasMany listing.

### Fixed
- Related Data - Fix a potential error on hasMany association update (remove a deprecated $pushAll operator).

## RELEASE 2.6.0 - 2018-03-29
### Added
- Smart Actions - "Single" type Smart Action forms can now be prefilled with contextual values.

## RELEASE 2.5.2 - 2018-03-27
### Changed
- Collections - Allow collection customization before liana initialization.

### Fixed
- Authentication - Fix the missing email/name/teams information set in the token for user using Google SSO.

## RELEASE 2.5.1 - 2018-03-21
### Fixed
- Smart Elements - Fix error swallowing on load and clean some useless code.
- Smart Fields - Boolean Smart Fields that return a "false" value are now properly sent though the API.

## RELEASE 2.5.0 - 2018-03-13
### Added
- MongoDB HasMany - Users can edit a document in an array of embedded documents.

### Changed
- Security - Fix low impact vulnerabilities.

## RELEASE 2.4.3 - 2018-03-12
### Added
- Smart Actions - Developers can define Smart Actions that can send their request to a different endpoint than the current environment endpoint.

## RELEASE 2.4.2 - 2018-03-08
### Fixed
- Close.io Integration - Send a "No Content" (204) status code if not customer lead has been found instead of an "Internal Server Error" (500).

## RELEASE 2.4.1 - 2018-03-07
### Changed
- Smart Fields - Display a warning if an error occurs during Smart Field value computations.

## RELEASE 2.4.0 - 2018-03-01
### Added
- Smart Actions - Users can define Smart Actions only available in a record detail.

## RELEASE 2.3.2 - 2018-02-28
### Changed
- Apimap - Catch potential failure during the apimap sorting.

### Fixed
- Smart Actions - Display the Smart Actions form fields in the declaration order. [Regression introduced in 2.4.0]

## RELEASE 2.3.1 - 2018-02-21
### Added
- Filters - Add a new "is after X hours ago" operator to filter on date fields.

## RELEASE 2.3.0 - 2018-02-07
### Added
- Databases Connections - Support multiple mongoose connections.

### Changed
- Apimap - Prevent random sorting collections and useless updates.

### Fixed
- Search - Prevent the records search to crash if no fields parameter is sent by the client.

## RELEASE 2.2.0 - 2018-02-02
### Changed
- Smart Fields - Compute only the necessary Smart Fields values for list views and CSV exports.

## RELEASE 2.1.2 - 2018-02-01
### Fixed
- Smart Fields - Fix concurrency between Smart Fields setters and enable multiple setters to work properly on a record update.

## RELEASE 2.1.1 - 2018-02-01
### Fixed
- CORS - Re-authorize forestadmin.com in the CORS configuration. [regression introduced in 2.0.6]

## RELEASE 2.1.0 - 2018-01-11
### Added
- Authentication - Users can connect to their project using Google Single Sign-On.

## RELEASE 2.0.6 - 2017-12-27
### Changed
- Performance - Reduce drastically the number of CORS preflight requests send by the API clients.

### Fixed
- Authentication - Developers whom want to extend the Admin API can now use the authentication for the overridden routes.

## RELEASE 2.0.5 - 2017-12-22
### Added
- Smart BelongsTo - Developers can now implement Smart BelongsTo values updates.
- Smart Fields - Add a "isFilterable" option to let them appear in the filters selection.

### Fixed
- Security - Remove a vulnerability by upgrading Moment.js library.

## RELEASE 2.0.4 - 2017-12-12
### Fixed
- Smart Fields - Prevent Smart Fields promise values injection errors on related data retrieval.

## RELEASE 2.0.3 - 2017-12-12
### Added
- TypeScript Support - Forest can now load TypeScript modules.

### Fixed
- Smart Fields - Prevent Smart Fields values injection errors on related data retrieval.

## RELEASE 2.0.2 - 2017-12-06
### Fixed
- Summary View - Fix potential Summary View freeze on records having "Point" type fields (if some related data are displayed).

## RELEASE 2.0.1 - 2017-12-05
### Fixed
- Filters - A filter condition set on related belongsTo/hasOne will not crash the list view anymore [Regression introduced in 2.0.0].

## RELEASE 2.0.0 - 2017-11-30
### Changed
- Collections Names - Collection names are now based on the model name.

## RELEASE 1.5.3 - 2017-11-27
### Added
- Stripe Integration - Allow users to display Stripe records in the Details view.

## RELEASE 1.5.2 - 2017-11-08
### Fixed
- Custom Domains - Make the feature usable natively with the CORS_ORIGINS variable.

## RELEASE 1.5.1 - 2017-11-06
### Changed
- Security - Remove all detected vulnerabilities upgrading some dependencies (nsp check --output summary).

## RELEASE 1.5.0 - 2017-10-26
### Fixed
- Apimaps - Prevent bad detection of Array of Embedded having the "type" keyword.

### Changed
- Smart Relationships - Add a warning if a Smart Collection does not define the "idField" attribute necessary for Smart Relationships.
- Smart Fields - Prevent the Smart Fields computation errors to generate a crash and handle it letting the value empty.

## RELEASE 1.4.9 - 2017-10-11
### Changed
- Sessions - Display a clean error message if the renderingId and envSecret are missing or inconsistent.

### Fixed
- Initialisation - Prevent bad "import" syntax error detections on initialisation.

## RELEASE 1.4.8 - 2017-10-06
### Fixed
- HasMany Relationships - Display BelongsTo links in the HasMany relationships table.

## RELEASE 1.4.7 - 2017-10-06
### Fixed
- Stripe - Fix the 'mapping' collection name on Express/Mongoose.
- Integrations - Ensure all the models are loading before integrations setup.

## RELEASE 1.4.6 - 2017-10-04
### Fixed
- Initialisation - Do not try to require file that don't have the js extension.

## RELEASE 1.4.5 - 2017-10-03
### Fixed
- Intercom - Make the conversation details accessible.

## RELEASE 1.4.4 - 2017-10-02
### Fixed
- Filters - Fix boolean filters with "false" or "null" values.

## RELEASE 1.4.3 - 2017-10-02
### Fixed
- Initialisation - Prevent bad ES2017 syntax error detections on initialisation.

## RELEASE 1.4.2 - 2017-10-02
### Changed
- Intercom Integration - Prefer Intercom accessToken configuration to old fashioned appId/apiKey.
- Intercom Integration - Remove support for old configuration parameter use "userCollection" (use mapping instead)

## RELEASE 1.4.1 - 2017-09-29
### Added
- Search - A search will now try to search in ObjectID type fields if the search value is a correct ObjectID.

### Fixed
- Search - Prevent an error if no field is searchable during a search.

## RELEASE 1.4.0 - 2017-09-27
### Added
- Search - Developers can configure in which fields the search will be executed.

## RELEASE 1.3.0 - 2017-09-20
### Added
- Smart Fields - Add a parameter to specify if the sorting is allowed on this field.

### Fixed
- Initialization - Ignore directories while loading models.

## RELEASE 1.2.5 - 2017-09-10
### Changed
- Initialization - Display an explicit error log if a model cannot be loaded properly

## RELEASE 1.2.4 - 2017-09-07
### Fixed
- Export - Fix datetime formatting regression introduced by liana version 1.2.3.

## RELEASE 1.2.3 - 2017-08-29
### Added
- Onboarding - Display an error message if the envSecret option is missing.
- Models Introspection - Support nested custom schemas for models.

### Fixed
- Exports - Escape special characters for the string fields.
- Integrations - Display models "mapping" errors if any.

## RELEASE 1.2.2 - 2017-08-24
### Added
- Integrations - Add the Layer integration.

### Fixed
- Code Inspection - Fix Forest customization code inspection to be recursive through directories.

## RELEASE 1.2.1 - 2017-08-23
### Fixed
- Exports - Fix bad initial implementation for exports authentication.

## RELEASE 1.2.0 - 2017-08-21
### Added
- Exports - Forest can now handle large data exports.
- Search - Split "simple" and "deep" search features with a new param.
- Search - Users can search on array of embeded documents.

## RELEASE 1.1.14 - 2017-08-09
### Added
- Integrations - Add a first version of Layer integration.

## RELEASE 1.1.13 - 2017-08-08
### Added
- Validations - Start the support of forms validations (with 5 first validations).
- Fields - Send the defaultValue for creation forms.

## RELEASE 1.1.12 - 2017-07-11
### Added
- Search - Users can search on the hasMany associated data of a specific record.

### Fixed
- HasMany Records - Fix the sorting of HasMany records.

## RELEASE 1.1.11 - 2017-07-05
### Added
- Filters - Add the before x hours operator.

### Fixed
- Liana Version & Orm Version - Prevent server crash on bad format version.

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
### Fixed
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
### Changed
- Smart field - Ensure a hasMany smart field doesn't trigger any error when the route is not yet implemented.

## RELEASE 0.3.2 - 2016-01-04
### Added
- Configurations - Users can specify the directory for Forest Smart Implementation.

### Fixed
- Configuration - Fix bad authentication when a custom path is configured.

## RELEASE 0.3.1 - 2016-12-13
### Fixed
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
