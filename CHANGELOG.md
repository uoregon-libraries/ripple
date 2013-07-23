## 1.0.4 (July 22, 2013)

* Cleaned code of old comments and comment code for auto-generation of documentation with yuidoc.

* Bug Fix client name not associating with answers continued


## 1.0.3 (July 3, 2013)

* Bug Fix reports not creating cvs

* Bug Fix client name not associating with answers

* Added License info file


## 1.0.2 (July 1, 2013)

* Improved upstart process to be owned by ripple


## 1.0.1 (July 1, 2013)

* Bug Fix install issues related to custom and plugins folder

* Bug Fix install with missing parameter


## 1.0.0 (June 30, 2013)

* Public Launch - Removed earlier commit for security reasons

* Bug Fix wysiwyg editor with embedded images

* Improve consistency of tooltip


## 1.0.0-rc1 (June 10, 2013)

* Updated node module plugin-manager to v2 to rearchitect plugins so that their functions can be executed seperately instead of with events

* Security Audit

** Ripple can now work with credentialed database

** Questions & Answers are refractored to enhance security and reduce client imposters

** Move some functionality of now.js into server session

** Answers are only sent to presenter

** Remove all hidden inputs with data that was moved into server session

** XSS & html is stripped from client answers

** Extracted stmp configuration with credentials to config.js

* Question Types have been extracted to database and isolated to individual libraries for modularity

* Plugin state is now persistant in database

* NPM package name ripple-core because of nameing conflict

* Answers have been truncate to 500 characters to improve efficiency of server

* System variables are now loaded in middleware

* Reports and associated data can now be set to auto-expire

* Added password recovery functionality

* Add Adaptation of Google Fastbutton for iOS devices

* Convert inline editor to x-editable to improve UX

* Standardize database collection names for 'sessions' and 'responses'

* Created RIPPLE & GLOBAL js object 



## 0.4.2 (April 15, 2013)

* Fixes bug causing Session ID not to generate correctly

* Change Active Question indicator for Session UI to icon

* Move js for openning of session into GLOBALS namespace

* Improvements to how popovers show on Admin Set Edit UI

* Improvement for FireFox specific bugs from QA

* Other various Bug Fixes


## 0.4.1 (April 8, 2013)

* Plugins can not load their own css and js for the config screen

* QA fixes from last round of testing

** Tested admin UI on iPad

** Improved consistency of focus and highlight for better usability

** Client UI Numeric Keyboard Refinements

** Converted UI buttons which were displaying with show/hide functionality to single instance and use js to change it's attributes and value. This allow button to not lose focus when it is initiated with keyboard

** Improved keyboard accessibility to controls in /admin/session

** Other various Bug Fixes

* Remove excess files including profileController.js

* Ripple name amended to all page titles


## 0.4.0 (March 22, 2013)

* Froze npm dependency with shrinkwrap file

* Created custom folder to contain with static route for customization by end user

* Update Bootstrap to v2.3.1 and Font Awesome to v3.0.2

* Updated Ripple logo and color scheme

* Add functionality to rename set title and class/presentation title

* Add swipe to open slidebar in admin UI

* Added plugin hook plugin:menuSave

* Added next / previous navigation buttons to session with sets

* Create executable for global install of package

	- Files are in /bin

	- Can utilize it with: <pre><code>$ ripple install</code></pre>

* Updated config.js to include option to reroute to ssl silently

* CSS table style consistency applied across interface

* Accessibility improvements for keyboard access to admin UI functionality

* Various Bug Fixes based on changing architecture 


### 0.3.5 (February 25, 2013)

* UX Improvements based on classroom testing
		
	- Numeric input for client was changed to textbox plus keypad
		
	- Chat was disabled across interface
		
	- Client answer is updated on UI and replaces inputs where appropriate

* Made UI keyboard accessible 

* Added Ripple logo

* Improved screenreader accessibility

### 0.3.4 

* Bug Fixes From QA

* Improved Slider functionality for iOS & IE9

* Refinement to Numeric Question type for presenter and client

* Added js console code for browsers that do not have console functionality

* Added Migrate Function for Authorization System

* User is now autologin after registration

* Note: Email password recovery is not functioning

### 0.3.3 (January 31, 2013)

* Bug Fixes From Beta Feedback of Faculty

