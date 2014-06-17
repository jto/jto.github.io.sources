module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-watch');

  var _site = '../jto.github.io';
  var _lessFiles = {};
  _lessFiles[_site + "/assets/css/main.css"] = "_assets/less/main.less";
  _lessFiles[_site + "/assets/css/blog.css"] = "_assets/less/blog.less";
  _lessFiles[_site + "/assets/css/resume.css"] = "_assets/less/resume.less";

  grunt.initConfig({

    watch: {
      less: {
        files: ['_assets/less/*.less'],
        tasks: 'less-build'
      },
      assets: {
        files: ['_assets/*'],
        tasks: 'assets-copy'
      },
      jekyllSources: {
        files: [
          '*.html',
          '*.yml',
          //'_assets/js/**.js',
          //'_assets/less/**.less',
          '_posts/**',
          '_layouts/**',
          '_includes/**'
        ],
        tasks: 'jekyll-build',
      }
    },

    // Generate _site using jekyll
    shell: {
      jekyll: {
        command: 'rm -rf ' +  _site + '/*; jekyll  build -d ' + _site,
        stdout: true
      }
    },

    less: {
      development: {
        options: {
          paths: ["_assets/less"],
          strictImports: true
        },
        files: _lessFiles
      }
    },

    copy: {
      development: {
        files: [
          { expand: true, cwd: '_assets', src: ['articles/**'], dest: _site + '/assets/' },
          { expand: true, cwd: '_assets', src: ['js/*'], dest: _site + '/assets/' },
          { expand: true, cwd: '_assets', src: ['images/*'], dest: _site + '/assets/' },
          { expand: true, cwd: '_assets', src: ['font/*'], dest: _site + '/assets/' },
          { expand: true, cwd: '_assets', src: ['scala_is_faster_than_java/*'], dest: _site + '/assets/' }
        ]
      }
    }

  });

  grunt.registerTask('less-build', ['less:development']);
  grunt.registerTask('assets-copy', ['copy:development']);
  grunt.registerTask('jekyll-build', ['shell:jekyll','less-build', 'assets-copy']);
  grunt.registerTask('default', 'watch');

};