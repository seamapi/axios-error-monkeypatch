import chalk from "chalk"
import { omitBy, isUndefined } from "lodash"
import concordance from "concordance"

/**
 * Ava formats Axios errors extremely verbose but somehow without important
 * information like the response body. I looked in Ava's source code and noticed
 * that they [formatted errors using concordance](https://github.com/avajs/ava/blob/843644b10fa2d3a9e6449f6022c40119c22fc9cf/lib/test.js#L11).
 * Using "resolutions" in the package.json file, I load the deduped version of
 * concordance and replace it with a version that handles Axios error formatting
 * better.
 */
export default () => {
  if (!concordance.simplify_error_monkeypatch) {
    concordance.simplify_error_monkeypatch = true
    const ogFormat = concordance.format
    concordance.format = (...args) => {
      // format the Axios errors better, and with more response data
      if (args?.[0]?.isAxiosError) {
        const { request, response, message } = args[0]
        return [
          chalk.bold(chalk.red("Axios HTTP Error!")),
          `${chalk.yellow(request?.method)} ${chalk.cyan(
            request?.path
          )} -> [${chalk.red(response?.status)}] ${response?.statusText}`,
          chalk.gray(message),
          response?.config?.data &&
            chalk.grey(
              `Request Data: ${(ogFormat(response?.config?.data), null, "  ")}`
            ),
          response?.data &&
            `Response: ${ogFormat(response?.data).slice(0, 500)}`,
          chalk.gray(
            ogFormat(
              omitBy(
                {
                  responseHeaders: response?.headers,
                  responseMessage: response?.message,
                  responseStack: response?.stack,
                },
                isUndefined
              ),
              null,
              "  "
            )
          ),
        ]
          .filter(Boolean)
          .join("\n")
      }

      return ogFormat(...args)
    }
  }
}
