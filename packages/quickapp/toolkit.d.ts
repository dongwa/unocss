
declare module '@aiot-toolkit/compiler/lib/style' {
  export default {
    parse({ code: string, filePath: string }) {
      return {
        jsonStyle: any
      }
    }
  }
}

declare interface ParseFragmentsResult {
  import: string[]
  template: string[]
  style: ToolkitStyle[]
  script: string[]
}

declare interface ToolkitStyle{
  attrs:any
  content:string
  location:{
    start:number
    end:number
    line:number
    column:number
  },
  type:string
}

declare module '@aiot-toolkit/compiler' {
  export default {
    parseFragments(code: string, filePath: string): ParseFragmentsResult {
    }
  }
}