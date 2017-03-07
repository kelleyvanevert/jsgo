
all:

kelleyvanevert.nl:
	scp -r * kelley@kelleyvanevert.nl:prime/kelleyvanevert.nl/public/scratch/go_torus

serve:
	sh serve.sh
