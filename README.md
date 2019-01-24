# Forest Admin in Nodejs (Express.js & Mongoose) [![Build Status](https://travis-ci.org/ForestAdmin/forest-express-mongoose.svg?branch=master)](https://travis-ci.org/ForestAdmin/forest-express-mongoose)

Forest Admin provides an off-the-shelf administration panel based on a highly-extensible API plugged into your application.

This project has been designed with scalability in mind to fit requirements from small projects to mature companies.

## Who Uses Forest Admin
- [Apartmentlist](https://www.apartmentlist.com)
- [Carbon Health](https://carbonhealth.com)
- [Ebanx](https://www.ebanx.com)
- [First circle](https://www.firstcircle.ph)
- [Forest Admin](https://www.forestadmin) of course :-)
- [Heetch](https://www.heetch.com)
- [Lunchr](https://www.lunchr.co)
- [Pillow](https://www.pillow.com)
- [Qonto](https://www.qonto.eu)
- [Shadow](https://shadow.tech)
- And hundreds more…

## Getting Started

Install Forest Admin here: [https://www.forestadmin.com](https://www.forestadmin.com)

## Documentation
[https://docs.forestadmin.com/express-sequelize](https://docs.forestadmin.com/express-sequelize)

## Features

### CRUD
All of your CRUD operations are natively supported. The API automatically
supports your data models' validation and allows you to easily extend or
override any API routes' with your very own custom logic.

<img width="300px" src="https://www.forestadmin.com/public/img/illustrations-dev/screens/crud.svg" alt="CRUD">

### Search & Filters
Forest Admin has a built-in search allowing you to run basic queries to
retrieve your application's data. Set advanced filters based on fields and
relationships to handle complex search use cases.

<img width="300px" src="https://www.forestadmin.com/public/img/illustrations-dev/screens/search.svg" alt="Search and Filters">

### Sorting & Pagination
Sorting and pagination features are natively handled by the Admin API. We're
continuously optimizing how queries are run in order to display results faster
and reduce the load of your servers.

<img width="300px" src="https://www.forestadmin.com/public/img/illustrations-dev/screens/sorting.svg" alt="Sorting and Pagination">

### Custom action
A custom action is a button which allows you to trigger an API call to execute
a custom logic. With virtually no limitations, you can extend the way you
manipulate data and trigger actions (e.g. refund a customer, apply a coupon,
ban a user, etc.)

<img width="300px" src="https://www.forestadmin.com/public/img/illustrations-dev/screens/custom.svg" alt="Sorting and Pagination">

### Export
Sometimes you need to export your data to a good old fashioned CSV. Yes, we
know this can come in handy sometimes :-)

<img width="300px" src="https://www.forestadmin.com/public/img/illustrations-dev/screens/export.svg" alt="Export">

### Segments
Get in app access to a subset of your application data by doing a basic search
or typing a query or implementing an API route.

<img width="300px" src="https://www.forestadmin.com/public/img/illustrations-dev/screens/segments.svg" alt="Segments">

### Dashboards
Forest Admin is able to tap into your actual data to chart out your metrics
using a simple UI panel, a query or a custom API call.

<img width="300px" src="https://www.forestadmin.com/public/img/illustrations-dev/screens/dashboard.svg" alt="Dashboard">

### WYSIWYG
The WYSIWYG interface saves you a tremendous amount of frontend development
time using drag'n'drop as well as advanced widgets to build customizable views.

<img width="300px" src="https://www.forestadmin.com/public/img/illustrations-dev/screens/wysiwyg.svg" alt="WYSIWYG">

### Custom HTML/JS/CSS
Code your own views using JS, HTML, and CSS to display your application data in
a more appropriate way (e.g. Kanban, Map, Calendar, Gallery, etc.).

<img width="300px" src="https://www.forestadmin.com/public/img/illustrations-dev/screens/customhtml.svg" alt="Custom views">

### Team-based permissions
Without any lines of code, manage directly from the UI who has access or can
act on which data using a team-based permission system.

<img width="300px" src="https://www.forestadmin.com/public/img/illustrations-dev/screens/team.svg" alt="Team based permissions">

### Third-party integrations
Leverage data from third-party services by reconciling it with your
application’s data and providing it directly to your Admin Panel. All your
actions can be performed at the same place, bringing additional intelligence to
your Admin Panel and ensuring consistency.

<img width="300px" src="https://www.forestadmin.com/public/img/illustrations-dev/screens/thirdparty.svg" alt="Third-party integrations">

### Notes & Comments
Assign your teammates to specific tasks, leave a note or simply comment a
record, thereby simplifying collaboration all across your organization.

<img width="300px" src="https://www.forestadmin.com/public/img/illustrations-dev/screens/notes.svg" alt="Notes and Comments">

### Activity logs
Monitor each action executed and follow the trail of modification on any data
with an extensive activity log system.

<img width="300px" src="https://www.forestadmin.com/public/img/illustrations-dev/screens/activity.svg" alt="Activity logs">

## How it works

The Forest Admin NPM package (aka Forest Liana) introspects all your data model
and dynamically generates the Admin API hosted on your servers. The Forest Admin
interface is a web application that handles communication between the admin
user and your application data through the Admin API.

<p align="center" style="margin: 60px 0">
  <img width="100%" src="https://www.forestadmin.com/public/img/illustrations-dev/schema-1.svg" alt="Howitworks">
</p>

## Licence

[GPL v3](https://github.com/ForestAdmin/forest-express-sequelize/blob/master/LICENSE)
