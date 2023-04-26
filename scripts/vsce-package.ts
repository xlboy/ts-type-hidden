import { execa } from 'execa';

async function main(toPublish: boolean) {
  if (toPublish) {
    await execa('vsce', ['publish', '--no-dependencies', '-p', process.env.VSCE_TOKEN!], {
      stdio: 'inherit'
    });
  } else {
    await execa('vsce', ['package', '--no-dependencies'], { stdio: 'inherit' });
  }
}

const args = process.argv.slice(2);
const toPublish = args.includes('--publish');

main(toPublish);
