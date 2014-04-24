eurajoki.info
=============

Environmental data server / viewer (not SOS but maybe later)

This is the technology of a complete environmental information system,
which comprises a web browser based user application, database, and
data server. The user application comprises a PHP/HTML part and a
JavaScript part. The JavaScript part depends on OpenLayers, Flot, and
jQuery. The database / data server part is designed to be completely
separate from the user application and may be at a completely
different server. PostgreSQL/PostGIS database is used and the server
software is written in Perl. The WFS of Geoinformatica (wfs.pl) is
used.

The system is currently deployed on http://eurajoki.info

Copyright 2014 Pyhäjärvi Institute http://www.pyhajarvi-instituutti.fi/english

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
