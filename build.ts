import cp from 'child_process';
import browerSync from 'browser-sync';

const isEnvironment = process.env.NODE_ENV as 'build' | 'start';
const start = new Date();
const inputDir = 'src';
const outputDir = 'dist';

const scripts = {
  pug: `pug ${inputDir}/pug/ -o ${outputDir}/ --hierarchy -P`,
  sass: `sass ${inputDir}/assets/css/:${outputDir}/css/ -s compressed --no-source-map`,
  postcss: `postcss ${outputDir}/css/ -d ${outputDir}/css/`,
  ts: 'node --loader ts-node/esm esbuild.ts',
  img: 'node imagemin.js',
  tsc: `tsc`,
  eslint: `eslint '${inputDir}/**/*.ts' --fix`,
  stylelint: `stylelint '${inputDir}/{**,.*}/*.{css,scss,sass}' --fix`,
};

const scriptExec = (script: string): Promise<void> => {
  return new Promise((res) => {
    cp.exec(script, (err) => {
      if (err) {
        throw new Error(err.message);
      } else {
        res();
      }
    });
  });
};

const build = async () => {
  if (isEnvironment === 'build') {
    const lint = () => {
      return Promise.all([scriptExec(`${scripts.stylelint}`), scriptExec(`${scripts.tsc} && ${scripts.eslint}`)]);
    };
    const pug = () => scriptExec(`${scripts.pug}`);
    const scss = () => scriptExec(`${scripts.sass} && ${scripts.postcss}`);
    const ts = () => scriptExec(`NODE_ENV=build ${scripts.ts}`);
    const img = () => scriptExec(`${scripts.img}`);

    await lint().then(() => Promise.all([pug(), scss(), ts(), img()]));
  } else {
    const pug = () => scriptExec(`${scripts.pug} -w`);
    const scss = () => scriptExec(`npm-watch sass`);
    const ts = () => scriptExec(`NODE_ENV=start ${scripts.ts}`);
    const img = () => scriptExec(`watch '${scripts.img}' ${inputDir}/assets/images/`);
    const server = () => {
      browerSync.init({
        server: outputDir,
        files: outputDir,
        open: 'external',
        online: true,
        notify: false,
      });
    };

    return Promise.all([pug(), scss(), ts(), img(), server()]);
  }
};

/**
 * Remove dist
 */
cp.exec(`rimraf ${outputDir}`);

/**
 * Exec Build
 */
build()
  .then(() => {
    const timeDiff = (new Date().getTime() - start.getTime()) / 1000;
    console.log(`\n===== \x1b[34mBuild Success!\x1b[0m [time: \x1b[32m${timeDiff.toFixed(1)}s\x1b[0m] =====\n`);
  })
  .finally(() => {
    //
  });
