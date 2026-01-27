const { withXcodeProject } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function getAllImages(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllImages(filePath, fileList);
    } else if (/\.(png|jpg|jpeg)$/i.test(file)) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function createContentsJson(fileName) {
  return JSON.stringify(
    {
      images: [
        {
          filename: fileName,
          idiom: "universal",
          scale: "1x",
        },
        {
          idiom: "universal",
          scale: "2x",
        },
        {
          idiom: "universal",
          scale: "3x",
        },
      ],
      info: {
        author: "xcode",
        version: 1,
      },
    },
    null,
    2,
  );
}

const withIOSAssets = (config) => {
  return withXcodeProject(config, async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const projectName = config.modRequest.projectName;
    const assetsDir = path.join(projectRoot, "assets", "images");
    const xcassetsDir = path.join(projectRoot, "ios", projectName, "Images.xcassets");

    // Get all images
    const images = getAllImages(assetsDir);

    images.forEach((imagePath) => {
      const fileName = path.basename(imagePath);
      const imageNameWithoutExt = path.basename(fileName, path.extname(fileName));

      // Create imageset folder
      const imagesetDir = path.join(xcassetsDir, `${imageNameWithoutExt}.imageset`);

      if (!fs.existsSync(imagesetDir)) {
        fs.mkdirSync(imagesetDir, { recursive: true });
      }

      // Copy image file
      const destPath = path.join(imagesetDir, fileName);
      fs.copyFileSync(imagePath, destPath);

      // Create Contents.json
      const contentsJsonPath = path.join(imagesetDir, "Contents.json");
      fs.writeFileSync(contentsJsonPath, createContentsJson(fileName));
    });

    return config;
  });
};

module.exports = withIOSAssets;
