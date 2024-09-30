Valen: React Native Mobile Development Kit & AI Assistant
===========================================================

Streamline your React Native development environment setup with this powerful automation tool.

Important Notice
---------------

The package "rn-mdk" has been deprecated. Please use "valen" instead.

Features
--------

* Automated setup for macOS, iOS, and Android development environments
* Cleanup utility for removing old React Native installations
* Customizable configuration options
* Easy-to-use command-line interface
* Git management
* AI-assisted coding with Aider
* Fastlane integration for CI/CD tasks
* React Native version upgrade and migration assistance
* Browser tasks
* Project rename

Prerequisites
-------------

* Node.js 14+
* macOS 10.15+
* Homebrew
* Xcode (for iOS development)
* Android Studio (for Android development)

Installation
------------

1. Install Homebrew (if not already installed):
      ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Install the CLI tool globally using npm:

      ```bash
   npm install -g valen
   ```

   Or, if you prefer to use JSR:

      ```bash
   npx jsr add @valen/valen
   ```

Usage
-----

Valen can be used with the following command-line options:

* `-c, --cleanup`: Remove old React Native installations
* `-i, --ios`: Set up iOS development environment
* `-a, --android`: Set up Android development environment
* `-g, --git`: Manage Git
* `-A, --aider`: Code with AI using Aider
* `-fl, --fastlane`: Run Fastlane tasks
* `-f, --full`: Perform full setup (cleanup, iOS, and Android)
* `-u, --upgrade`: Migrate React Native project to a new version
* `-V, --version`: Output the version number
* `-h, --help`: Display help for command

If no options are provided, valen will show an interactive menu.

### Examples

1. Perform a full setup:

      ```bash
   valen --full
   ```

2. Clean up old installations and set up iOS environment:

      ```bash
   valen --cleanup --ios
   ```

React Native Upgrade
--------------------

Valen provides a simple way to upgrade your React Native project to a new version.

### Usage

1. Run the following command to upgrade your project:

      ```bash
   valen --upgrade
   ```

2. Follow the prompts to select the target version and apply the necessary changes.

### Options

* `-u, --upgrade`: Initiate the upgrade process
* `auto`: Perform the upgrade automatically
* `--app-name`: Specify your app's name
* `--app-package`: Specify your app's package name
* `--current-version`: Specify the current React Native version
* `--target-version`: Specify the target React Native version

### Example

```bash
valen -u auto --app-name 'bonder' --app-package 'com.bonderconnect.app' --current-version '0.72.6' --target-version '0.75.3'
```

Video Demo
----------

- Android:

 [![Video Demo](https://img.youtube.com/vi/RctLdGofZOk/0.jpg)](https://youtu.be/RctLdGofZOk)

- iOS and Cleanup: 

[![Video Demo](https://img.youtube.com/vi/uJEM3v3oUZM/0.jpg)](https://youtu.be/uJEM3v3oUZM)

- AI Assistant:

 [![AI Assistant](https://img.youtube.com/vi/PCoLMqSlg8A/0.jpg)](https://youtu.be/PCoLMqSlg8A)

Contributing
------------

We welcome contributions to improve valen. Please follow these steps to contribute:

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes and commit them with a clear commit message
4. Push your changes to your fork
5. Submit a pull request to the main repository

Please ensure your code adheres to our coding standards and includes appropriate tests.

License
-------

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Support
-------

If you need help or have any questions, please open an issue on our GitHub repository or contact our support team at cto@val-x.com

Acknowledgements
---------------

We would like to thank the React Native community and all the contributors who have helped make this tool possible.

Recent Updates
--------------

* Changed package name to 'valen' on npm and '@valen/valen' on JSR
* Added Homebrew as a prerequisite and installation instructions
* Updated troubleshooting section with Homebrew-related checks
* Improved error handling for missing dependencies

Future Features
--------------

Here are some planned enhancements for future versions of valen:

1. Automated dependency management: Intelligent updating and conflict resolution for project dependencies.
2. Custom template support: Allow users to create and use their own project templates.
3. Plugin system: Extend functionality through community-created plugins.
4. Cross-platform code sharing: Improved tools for sharing code between iOS and Android.
5. Performance optimization tools: Built-in profiling and suggestions for app performance improvements.
6. Integrated testing framework: Streamlined setup and execution of unit and integration tests.
7. CI/CD pipeline templates: Ready-to-use configurations for popular CI/CD platforms.
8. Hot module replacement enhancements: Faster and more reliable HMR during development.
9. Native module integration wizard: Simplified process for adding and configuring native modules.
10. App store submission helper: Automate parts of the app store submission process.

Future Usage
------------

```bash
# Initialize a new React Native project
valen init MyNewProject

# Run your React Native app
valen run-android
valen run-ios

# Generate components or screens
valen generate component MyComponent
valen generate screen MyScreen

# Add dependencies
valen add redux react-redux

# Rename a project
valen rename MyNewProject MyOldProject

# Open the React Native Code Editor
valen --open

# Run browser tasks
valen --browse 'play shape of you on youtube'

# Build and sign apps (future feature)
valen --build

# Auto-submit to app stores (future feature)
valen --auto-submit

# Publish app updates (future feature)
valen --publish -b production -v 1.0.1
```

We're always looking to improve valen. If you have suggestions for additional features, please open an issue or submit a pull request!
