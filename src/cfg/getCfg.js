import _debug from 'debug';
const debug = _debug('app:mongo:ops');
import path from 'path';
import config from './index';

export const getConfig = key => {
  if (!key) return null;
  let attrArr = key.split('.');

  let data = null;
  let subitem = config;
  for (let i = 0; i < attrArr.length; i++) {
    let attr = attrArr[i];
    if (i == attrArr.length - 1) {
      data = subitem && subitem[attr];
      break;
    }
    subitem = subitem && subitem[attr];
  }
  return data;
};

export const getXxAppCode = () => {
  return process.env.XX_APPCODE || config.xianxing.AppCode;
};
