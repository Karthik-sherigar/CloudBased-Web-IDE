export const getFileMode = ({ selectedFile }) => {
  const splitedArray = selectedFile.split(".");
  
  const extension = splitedArray[splitedArray.length - 1];

  switch (extension) {
    case "js":
      return "javascript";
    case "jsx":
      return "javascript";
    case "ts":
      return "typescript";
    case "tsx":
      return "typescript";
    case "py":
      return "python";
    case "java":
      return "java";
    case "c":
      return "c_cpp";
    case "cpp":
      return "c_cpp";
    case "cc":
      return "c_cpp";
    case "cxx":
      return "c_cpp";
    case "h":
      return "c_cpp";
    case "hpp":
      return "c_cpp";
    case "xml":
      return "xml";
    case "rb":
      return "ruby";
    case "sass":
      return "sass";
    case "scss":
      return "scss";
    case "md":
      return "markdown";
    case "sql":
      return "mysql";
    case "json":
      return "json";
    case "html":
      return "html";
    case "htm":
      return "html";
    case "hbs":
      return "handlebars";
    case "handlebars":
      return "handlebars";
    case "go":
      return "golang";
    case "cs":
      return "csharp";
    case "litcoffee":
      return "coffee";
    case "css":
      return "css";
    case "php":
      return "php";
    case "sh":
      return "sh";
    case "bash":
      return "sh";
    case "yml":
      return "yaml";
    case "yaml":
      return "yaml";
    default:
      return "text";
  }
};
