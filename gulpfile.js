const gulp = require('gulp');
const merge = require("merge-stream");
const path = require('path');
const del = require('del');

const assets = require('./assets');

const DEST = './dist';

gulp.task('clean', function(){
  return del([DEST]);
});

gulp.task('copy-resources', () => 
  merge(    
    assets
      .map(asset => path.join('./node_modules', asset))
      .map(asset => gulp.src(asset, {base: "./node_modules" }).pipe(gulp.dest(DEST)))
      .concat([
        gulp.src('./app/*').pipe(gulp.dest(DEST))
      ])
  )
);


gulp.task('default', gulp.series('clean', 'copy-resources', (done) => done()));