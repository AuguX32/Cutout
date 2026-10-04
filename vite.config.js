import {defineConfig} from 'vite';
export default defineConfig({base:'./',worker:{format:'es'},server:{watch:{ignored:['**/release/**','**/desktop-models/**','**/desktop-runtime/**']}}});
