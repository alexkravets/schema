import jsdoc from 'eslint-plugin-jsdoc';
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';

export default tseslint.config(
  globalIgnores([ '**/dist/', '**/coverage/' ]),
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      jsdoc,
    },
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      'jsdoc/require-jsdoc': ['error', {
        require: {
          ArrowFunctionExpression: true,
          ClassDeclaration: true,
          ClassExpression: true,
          FunctionDeclaration: true,
          FunctionExpression: true,
          MethodDefinition: true,
        },
      }],
    }
  },
  //     'no-console': ['warn'],
  //     indent: ['error', 2, {
  //       SwitchCase: 1,
  //       VariableDeclarator: 2,
  //     }],
  //     complexity: ['error', { max: 7 }],
  //     'comma-dangle': ['error', {
  //       arrays: 'always-multiline',
  //       objects: 'always-multiline',
  //       imports: 'never',
  //       exports: 'never',
  //       functions: 'never',
  //     }],
  //     'space-before-function-paren': ['error', {
  //       anonymous: 'always',
  //       named: 'never',
  //       asyncArrow: 'always',
  //     }],
  //     'jsdoc/check-tag-names': ['warn', {
  //       definedTags: ['swagger'],
  //     }],
  //   },
  // },
  eslint.configs.recommended,
  tseslint.configs.recommended
);


// import globals from "globals";
// import path from "node:path";
// import { fileURLToPath } from "node:url";
// import js from "@eslint/js";
// import { FlatCompat } from "@eslint/eslintrc";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const compat = new FlatCompat({
//     baseDirectory: __dirname,
//     recommendedConfig: js.configs.recommended,
//     allConfig: js.configs.all
// });

// export default [...compat.extends("eslint:recommended"), {
//     languageOptions: {
//         globals: {
//             ...globals.node,
//             ...globals.mocha,
//         },

//         ecmaVersion: 2018,
//         sourceType: "commonjs",
//     },

//     rules: {
//         "comma-style": "error",
//         "consistent-this": ["error", "_this"],

//         indent: ["error", 2, {
//             SwitchCase: 1,
//             VariableDeclarator: 2,
//         }],

//         "keyword-spacing": "error",
//         "no-multi-spaces": "off",
//         "no-spaced-func": "error",
//         "no-trailing-spaces": "error",
//         quotes: ["error", "single"],
//         semi: ["error", "never"],
//         curly: ["error"],
//         "prefer-arrow-callback": "error",
//         "space-before-blocks": "error",

//         "space-before-function-paren": [1, {
//             anonymous: "always",
//             named: "never",
//         }],

//         "space-infix-ops": "error",
//         "space-unary-ops": "error",
//         "no-return-await": "error",
//         eqeqeq: "error",
//     },
// }];
