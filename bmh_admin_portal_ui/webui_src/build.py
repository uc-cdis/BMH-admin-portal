#!/usr/bin/env python

import argparse
import json
import os
import shutil

import jinja2

class BmhWebUiBuilder():
    """ Class to build the BMH Portal UI. Uses jinja2 templating of 
    individual files. This class can be imported to be used from a
    CDK application or as an executable directly. """

    render_files = [
        'js/config.js',
        'request_workspace.html',
        'signin.html',
        'accounts.html',
        'index.html'
    ]

    skip_files = [
        'build.py'
    ]

    @classmethod
    def build_ui(cls, dist_dir, template_vars):
        """ Copy the entire src directory to the dist directory and overwrite the
        files which are configured in render_files list. Then remove the files in 
        the skip_files list """
        
        dir_path = os.path.dirname(os.path.realpath(__file__))
        shutil.copytree(dir_path, dist_dir, dirs_exist_ok=True)

        for root, _, files in os.walk(dir_path):
            for name in files:
                full_path = os.path.join(root,name)
                rel_path = os.path.relpath(full_path,start=dir_path)
                dest_path = os.path.join(dist_dir,rel_path)

                if rel_path in cls.render_files:
                    rendered = jinja2.Template(open(full_path).read()).render(**template_vars)
                    with open(dest_path,"w") as f:
                        f.write(rendered)
                elif rel_path in cls.skip_files:
                    try:
                        os.remove(dest_path)
                    except:
                        pass

def init_argparse():
    parser = argparse.ArgumentParser(
        description="Build BMH Web UI into provided dist_directory"
    )

    parser.add_argument(
        "-d", "--dist_dir", type=str, required=True,
        help="Directory for build assets"

    )
    parser.add_argument(
        '-j', '--json_parameters', type=str, required=True,
        help="JSON String of build parameters"
    )
    
    return parser.parse_args()

def main():
    args = init_argparse()
    template_vars = json.loads(args.json_parameters)
    BMHWebUIBuilder.build_ui(args.dist_dir, template_vars)

        

if __name__ == "__main__":
    main()