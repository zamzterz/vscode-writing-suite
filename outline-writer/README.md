# Outline Writer

Display text outline, gathered from files with synopsis in YAML front matter.

![Outline view](images/outline_view.png)

## Get started

1. Add YAML front matter to your text files, for example:
    ```yaml
    ---
    title: Get started
    synopsis: Describes how to get started
    ---
    ```

1. Add an `.outline` file in the root of the directory where the text files are located.

   Each line should be a relative path to a file that should be included in the outline, for example:
   ```txt
   ./0. Foreword.md
   ./Chapter 1/1. Getting started.md
   ./Chapter 1/2. Moving on.md
   ./Chapter 2/At the disco/Dancing.md
   ```

   To easily generate the `.outline` for all Markdown files recursively in a directory:

   ```sh
   $ cd <project directory>
   $ find . -name "*.md" | sort > .outline
   ```

   The outline file may also contain inline notes, which can be created by prepending the line with `note:`:
   ```txt
   ./0. Foreword.md
   ./Chapter 1/1. Getting started.md
   ./Chapter 1/2. Moving on.md
   note: We can have some notes inlined here as well.
   ./Chapter 2/At the disco/Dancing.md
   note: We're done!
   ```


## Features

This extension supports the following fields in YAML front matter:
* `title`: May be empty, defaults to the filename.
* `synopsis`: May be empty, defaults to empty string.
* `color`: Background color (only applies to HTML format) in CSS hex color format. May be empty, defaults to transparent.
* `date`: May be empty, defaults to empty string.

The generated outline is accessible either via the Activity Bar, or via the context menu when right-clicking a `.outline` file in the File Explorer.


## Extension Settings

This extension contributes the following settings:

* `outline-writer.outlineFormat`: which format the outline should be rendered as.
* `outline-writer.defaultColor`: default color for items in the outline (only applies to HTML format)
* `outline-writer.noteColor`: color for notes in the outline (only applies to HTML format)


#### Icon

The icon of this extension is a derivative of "Pen by VectorsLab from the Noun Project", used under CC BY.
