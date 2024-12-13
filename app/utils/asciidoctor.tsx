import { type Block, type Html5Converter } from '@asciidoctor/core'
import { InlineConverter, loadAsciidoctor } from '@oxide/design-system/components/dist'
import { renderToString } from 'react-dom/server'

import { InlineImage } from '~/components/AsciidocBlocks/Image'

const attrs = {
  sectlinks: 'true',
  stem: 'latexmath',
  stylesheet: false,
}

const ad = loadAsciidoctor({})

class CustomInlineConverter {
  baseConverter: Html5Converter

  constructor() {
    this.baseConverter = new InlineConverter()
  }

  convert(node: Block, transform: string) {
    switch (node.getNodeName()) {
      case 'inline_image':
        return renderToString(<InlineImage node={node} />)
      case 'image':
        return renderToString(<InlineImage node={node} />)
      default:
        break
    }

    return this.baseConverter.convert(node, transform)
  }
}

ad.ConverterFactory.register(new CustomInlineConverter(), ['html5'])

export { ad, attrs }
