import { defineType, defineField } from 'sanity'
import S3UploaderInput from '../components/S3UploaderInput'

export const sample = defineType({
  name: 'sample',
  title: 'Sample',
  type: 'document',
  fields: [

    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(2),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),

    // --- Categories (many-to-many) ---
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
      validation: (Rule) => Rule.min(1).warning('Add at least one category'),
    }),

    // --- High-resolution file (WAV on S3) ---
    defineField({
      name: 'highResFile',
      title: 'High-Res WAV (private S3 storage)',
      type: 'object',
      components: {
        input: S3UploaderInput,
      },
      fields: [
        defineField({
          name: 'fileName',
          title: 'File name',
          type: 'string',
          readOnly: true,
        }),
        defineField({
          name: 's3Key',
          title: 'S3 Key',
          type: 'string',
          readOnly: true,
        }),
        defineField({
          name: 'mp3AssetId',
          title: 'MP3 Asset ID',
          type: 'string',
          readOnly: true,
        }),
        defineField({
          name: 'mp3Url',
          title: 'MP3 URL',
          type: 'url',
          readOnly: true,
        }),
      ],
      options: {
        collapsible: true,
        collapsed: false,
      },
    }),

    // --- MP3 Preview (Sanity asset reference) ---
    defineField({
      name: 'previewFile',
      title: 'Preview MP3',
      type: 'file',
      options: {
        accept: 'audio/mpeg',
      },
      readOnly: true,
      description:
        'Automatically generated low-resolution MP3 preview for playback in the site or Studio.',
    }),
  ],

  // --- Studio preview configuration ---
  preview: {
    select: {
      title: 'title',
      categories: 'categories',
    },
    prepare({ title, categories }) {
      // categories are references; only IDs are available here,
      // so we just show a count to avoid the invalid `categories[]->title` path.
      const count = Array.isArray(categories) ? categories.length : 0
      return {
        title,
        subtitle: count > 0 ? `${count} categor${count > 1 ? 'ies' : 'y'}` : 'No categories',
      }
    },
  },
})
