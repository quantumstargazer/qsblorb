function userMarkdownSetup(md) {
  /*
   * Infobox syntax
   *
   * Converts:
   *
   *     // Basic Info
   *     Name -> Info
   *
   * into HTML classes expected by infoboxes-styles.css.
   */

  md.core.ruler.before("block", "infobox-syntax", function (state) {
    const lines = state.src.split("\n");

    let insideInfobox = false;
    let output = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      /*
       * Detect the beginning of an infobox.
       *
       * We intentionally support both normal and right/left infobox
       * callouts.
       */
      if (/^\s*>\s*\[!infobox(?:right|left)?\b/i.test(line)) {
        insideInfobox = true;
        output.push(line);
        continue;
      }

      /*
       * A non-indented line after an infobox means we have left it.
       */
      if (
        insideInfobox &&
        line.trim() !== "" &&
        !/^\s*>\s?/.test(line)
      ) {
        insideInfobox = false;
      }

      if (!insideInfobox) {
        output.push(line);
        continue;
      }

      /*
       * Section headings
       *
       *     > // Basic Info
       *
       * becomes:
       *
       *     > <span class="section">Basic Info</span>
       */
      const sectionMatch = line.match(
        /^(\s*>\s*)\/\/\s*(.+?)\s*$/
      );

      if (sectionMatch) {
        output.push(
          `${sectionMatch[1]}<span class="section">${sectionMatch[2]}</span>`
        );
        continue;
      }


	/*
	 * Nested infobox rows
	 *
	 * Handles the nested blockquote syntax used by the
	 * apparent-age/year section.
	 *
	 *     > > YEAR -> XX +/- years
	 *
	 * The nested ">" is removed so it doesn't appear
	 * as literal text in the rendered infobox.
	 */
	const nestedLabelMatch = line.match(
	  /^(\s*>\s*)>\s*(.*?)\s+->\s+(.*)$/
	);

	if (nestedLabelMatch) {
	  const prefix = nestedLabelMatch[1];
	  const label = nestedLabelMatch[2].trim();
	  const value = nestedLabelMatch[3].trim();

	  output.push(
		`${prefix}<span class="label-line nested-label-line"><span class="label">${label}</span><span>${value}</span></span>`
	  );
	  continue;
	}


      /*
       * Label/value lines
       *
       *     > Name -> Info
       *
       * becomes:
       *
       *     > <span class="label-line">
       *     >   <span class="label">Name</span>
       *     >   <span>Info</span>
       *     > </span>
       *
       * The actual HTML is kept on one line so Markdown does not
       * introduce unwanted paragraph structure.
       */
      const labelMatch = line.match(
        /^(\s*>\s*)(.*?)\s+->\s+(.*)$/
      );

      if (labelMatch) {
        const prefix = labelMatch[1];
        const label = labelMatch[2].trim();
        const value = labelMatch[3].trim();

        output.push(
          `${prefix}<span class="label-line"><span class="label">${label}</span><span>${value}</span></span>`
        );
        continue;
      }

      output.push(line);
    }

    state.src = output.join("\n");
  });
}

function userEleventySetup(eleventyConfig) {
  /*
   * The Infoboxes CSS was originally written for Obsidian and
   * expects the following Style Settings classes to exist.
   *
   * Add them to the document body so the existing CSS can use
   * its normal defaults on the Digital Garden site.
   */
  eleventyConfig.addTransform("infobox-classes", function (content) {
    if (!content || !content.includes('data-callout="infobox')) {
      return content;
    }

    return content.replace(
      /<body([^>]*)>/i,
      (match, attributes) => {
        const classes = [
          "ic-title-align-center",
          "ic-title-bg-margins",
          "ic-section-background-toggle",
          "ic-section-bg-margins",
          "ic-label-bg-margins",
          "ic-arrow-style-infoboxes",
          "ic-table-pattern-infoboxes",
        ];

        let bodyAttributes = attributes;

        const classMatch = bodyAttributes.match(
          /\bclass=(["'])(.*?)\1/i
        );

        if (classMatch) {
          const quote = classMatch[1];
          const existingClasses = classMatch[2]
            .split(/\s+/)
            .filter(Boolean);

          for (const className of classes) {
            if (!existingClasses.includes(className)) {
              existingClasses.push(className);
            }
          }

          bodyAttributes = bodyAttributes.replace(
            classMatch[0],
            `class=${quote}${existingClasses.join(" ")}${quote}`
          );
        } else {
          bodyAttributes += ` class="${classes.join(" ")}"`;
        }

        return `<body${bodyAttributes}>`;
      }
    );
  });
}

exports.userMarkdownSetup = userMarkdownSetup;
exports.userEleventySetup = userEleventySetup;