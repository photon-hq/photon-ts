import Foundation

guard CommandLine.arguments.count > 1 else {
    print("Error: No base64 input provided")
    exit(1)
}

guard let data = Data(base64Encoded: CommandLine.arguments[1]) else {
    print("Error: Invalid base64 input")
    exit(1)
}

let unarchiver = NSUnarchiver(forReadingWith: data)
if let bodyObject = unarchiver?.decodeObject() as? NSAttributedString {
    print(bodyObject.string)
    exit(0)
} else {
    if let str = String(data: data, encoding: .utf8) {
        if str.hasPrefix("streamtyped") {
            let components = str.components(separatedBy: "NSString")
            if components.count > 1 {
                let content = components[1].trimmingCharacters(in: CharacterSet(charactersIn: " \t\n"))
                    .replacingOccurrences(of: "\"", with: "")
                print(content)
                exit(0)
            }
        }
        print(str)
        exit(0)
    }
    print("Error: Failed to decode content")
    exit(1)
}
