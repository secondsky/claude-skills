#!/usr/bin/env ruby
#
# Extract embedded Keywords from description into metadata.keywords YAML list.
#
# Usage:
#   ruby scripts/extract-keywords.rb              # Apply changes
#   ruby scripts/extract-keywords.rb --dry-run    # Preview only

require 'yaml'
require 'date'

REPO_ROOT = File.expand_path('..', __dir__)
PLUGINS_DIR = File.join(REPO_ROOT, 'plugins')
DRY_RUN = ARGV.include?('--dry-run')

def find_skill_files(dir)
  results = []
  Dir.entries(dir).each do |entry|
    next if entry.start_with?('.')
    full = File.join(dir, entry)
    if File.directory?(full)
      results.concat(find_skill_files(full))
    elsif entry == 'SKILL.md'
      results << full
    end
  end
  results.sort
end

def quote_yaml_value(str)
  if str.include?(':') || str.include?('"') || str.include?('#') || str.include?("'")
    '"' + str.gsub('\\', '\\\\\\\\').gsub('"', '\\"') + '"'
  else
    '"' + str + '"'
  end
end

def quote_keyword(kw)
  if kw.start_with?('@', '`') || kw.include?(':') || kw.include?('#') || kw.include?('"')
    '"' + kw.gsub('"', '\\"') + '"'
  else
    kw
  end
end

def process_file(file_path)
  content = File.read(file_path)

  unless content.start_with?("---\n")
    return nil
  end

  end_match = content.index("\n---\n", 4)
  return nil unless end_match

  fm_raw = content[4...end_match]
  fm_end = end_match + 5

  # Match the description: >- block
  desc_match = fm_raw.match(/^description: >-\n((?:  .*\n|\n)+)/)
  return nil unless desc_match

  desc_block = desc_match[1]

  # Find Keywords within the description block
  kw_pos = desc_block.index(/^(?: {2,4})Keywords:/)
  return nil unless kw_pos

  # Split into prose (before Keywords) and keywords section
  prose_part = desc_block[0...kw_pos]
  kw_part = desc_block[kw_pos..]

  # Extract prose text
  prose = prose_part.lines.map(&:strip).reject(&:empty?).join(' ')
  return nil if prose.empty?

  # Extract keywords
  full_kw = kw_part.lines.map { |l| l.strip.sub(/^Keywords:\s*/, '') }.join(' ').gsub(/\s+/, ' ').strip
  keywords = full_kw.split(',').map(&:strip).reject(&:empty?)
  return nil if keywords.empty?

  # Quote the description
  desc_value = quote_yaml_value(prose)

  # Quote keywords that need it
  quoted_keywords = keywords.map { |k| quote_keyword(k) }

  # Build the replacement frontmatter
  # Step 1: Replace description block
  old_desc_block = desc_match[0].rstrip + "\n"
  new_desc_line = "description: #{desc_value}\n"

  fm_after_desc = fm_raw.sub(old_desc_block, new_desc_line)
  # Clean up double blank lines
  fm_after_desc = fm_after_desc.gsub(/\n{3,}/, "\n\n")

  # Step 2: Add keywords to metadata
  lines = fm_after_desc.lines.map(&:chomp)

  # Build the keyword YAML block
  kw_yaml = ["  keywords:"] + quoted_keywords.map { |k| "    - #{k}" }

  meta_line_idx = lines.index { |l| l == "metadata:" }

  if meta_line_idx
    # Find last child of metadata block
    last_child_idx = meta_line_idx
    (meta_line_idx + 1...lines.length).each do |j|
      if lines[j].start_with?('  ') && lines[j].strip != ''
        last_child_idx = j
      elsif lines[j].strip == ''
        # blank line - might be within metadata, keep looking
        next
      else
        break
      end
    end

    # Insert after last child, with a blank line between if needed
    kw_yaml.each_with_index do |line, offset|
      lines.insert(last_child_idx + 1 + offset, line)
    end
  else
    # No metadata section - create one
    # Find insertion point (before license or allowed-tools)
    insert_idx = lines.index { |l| l =~ /^(license:|allowed-tools:)/ }
    insert_idx ||= lines.length

    meta_block = ["metadata:"] + kw_yaml

    # Insert with blank lines around
    lines.insert(insert_idx, "")
    meta_block.each_with_index do |line, offset|
      lines.insert(insert_idx + 1 + offset, line)
    end
    lines.insert(insert_idx + 1 + meta_block.length, "")
  end

  new_fm = lines.join("\n")

  # Verify valid YAML
  begin
    YAML.safe_load(new_fm, permitted_classes: [Date, Time])
  rescue => e
    $stderr.puts "  Error: Invalid YAML for #{file_path.sub("#{REPO_ROOT}/", '')}: #{e.message}"
    return nil
  end

  new_content = "---\n#{new_fm}\n---#{content[fm_end..]}"
  { new_content: new_content, keywords: keywords, prose: prose }
end

files = find_skill_files(PLUGINS_DIR)
modified = 0

files.each do |file|
  result = process_file(file)
  next unless result

  modified += 1
  rel = file.sub("#{REPO_ROOT}/", '')

  if DRY_RUN
    puts "[DRY RUN] #{rel}"
    puts "  Keywords: #{result[:keywords].length}"
    puts "  Description: #{result[:prose][0..80]}..."
  else
    new_c = result[:new_content]
    File.write(file, new_c)
    puts "Fixed: #{rel} (#{result[:keywords].length} keywords)"
  end
end

puts
puts "#{DRY_RUN ? '[DRY RUN] ' : ''}Modified: #{modified} file(s)"
