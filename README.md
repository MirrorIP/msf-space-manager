# MSF Account Manager
The MSF Space Manager is a tool to manage spaces in the [MIRROR Spaces Framework][1]. It is a web application using the XMPP protocol to perform all operations.

## Build
To build the application an build script for [Apache Ant][2] is provided.

## Configure
The application is configured over the file `settings.js` in the root directory. The following parameters are available:

* **APP_ID**
Application ID to use to identify the space manager in the XMPP network (i.e. XMPP resouce ID). This value does only need to be changed when multiple instances of the space managers access the MSF.
* **HTTP_BIND**
HTTP binding (BOSH) interface to use. You can either bind on the BOSH port of the Openfire server directly using [CORS][3] (since Openfire 3.8) or on a reverse proxy on the web server the application is deployed on. Both absolute and relative URLs are allowed, e.g. `http://mydomain.com/http-bind/` or `/http-bind/`.
*NOTE:* For compatibiliy reasons (browser support, firewall settings) it is recommended to use a reverse proxy as binding interfave.
* **DOMAIN**
The XMPP domain to use, e.g. `mirror-demo.eu`.

## Install
The `dist` directory can be renamed and deployed on any web server which can deliver static files. We recommend to use a web server capable of reverse proxying, e.g., [Apache HTTPD][4] or [nginx][5].

## Usage
Upon the URL in the web browser. The Space Manager allows the management of spaces from user perspective: Any user registered at the XMPP network may log in using his/her XMPP user creadential, i.e. user id and password.

## License
The MIRROR Space Manager is provided under the Apache [License 2.0][6].
License information for third party libraries is provided with the JS files.

## Changelog
v1.1.0 - March 6, 2014

* Updated to Spaces SDK for JavaScript 1.3.
* Moved application configuration to separated file.
* Removed XML beautifier, as it did not work properly.

v1.0.0 - September 3, 2013

* Initial release.


  [1]: https://github.com/MirrorIP/msf
  [2]: http://ant.apache.org/
  [3]: http://de.wikipedia.org/wiki/Cross-Origin_Resource_Sharing
  [4]: http://httpd.apache.org/
  [5]: http://nginx.org/
  [6]: http://www.apache.org/licenses/LICENSE-2.0.html