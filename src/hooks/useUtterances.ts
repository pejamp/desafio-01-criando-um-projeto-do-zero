import { useEffect, useState } from "react"

const REPO_NAME = 'pejamp/spacetraveling-utterance-comments';

export const useUtterances = (commentNodeId: string) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (!visible) {
      return
    }
    console.log('Loading Comments');

    const script = document.createElement('script')

    script.src = 'https://utteranc.es/client.js'
    script.async = true
    script.setAttribute('repo', REPO_NAME)
    script.setAttribute('issue-term', 'pathname')
    script.setAttribute('label', 'comment :speech_balloon:')
    script.setAttribute('theme', 'photon-dark')
    script.setAttribute('crossorigin', 'anonymous')

    const scriptParentNode = document.getElementById(commentNodeId);
    scriptParentNode.appendChild(script);

    return () => {
      scriptParentNode.removeChild(scriptParentNode.firstChild);
    };
  }, [visible]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
          }
        });
      },
      {
        threshold: 1,
      }
    );
    observer.observe(document.getElementById(commentNodeId));
  }, []);
}