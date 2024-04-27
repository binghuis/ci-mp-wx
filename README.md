# ci-mp-wx

```ts
// ci-mp-wx.config.ts

import { CIMpWXConfig } from 'ci-mp-wx';

const config: CIMpWXConfig = {
  project: {
    appid: '',
    type: 'miniProgram',
    projectPath: 'dist/build/mp-weixin',
    privateKeyPath: 'private.key',
  },
};

export default config;
```
