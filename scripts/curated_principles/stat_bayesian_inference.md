---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 베이즈 정리, 사후 확률, 사전 확률, 우도, 베이즈 신경망, 불확실성 정량화, 베이즈 최적화, 모델 평균화
keywords_en: Bayes theorem, posterior, prior, likelihood, Bayesian neural networks, uncertainty quantification, Bayesian optimization, model averaging
---
Bayesian Inference - 데이터로부터 믿음을 갱신하는 확률적 학습의 근본 프레임워크

## 역사적 기원: 목사의 유고와 수학자의 완성

Bayesian Inference의 씨앗은 영국 장로교 목사 Thomas Bayes(1701-1761)가 남긴 유고 논문 "An Essay towards solving a Problem in the Doctrine of Chances"(1763, 사후 출판)에서 시작된다. 이 논문에서 Bayes는 단순하지만 심오한 질문을 던졌다. "결과를 관찰한 뒤, 그 결과를 낳은 원인의 확률을 어떻게 계산할 수 있는가?" 이것은 원인에서 결과로 향하는 일반적 확률 추론의 방향을 뒤집는 것이었다.

Pierre-Simon Laplace(1812)가 이를 수학적으로 엄밀하게 체계화하면서 베이즈 정리는 확률론의 핵심 도구가 되었다. 20세기에 들어 Harold Jeffreys(1939)는 비정보적 사전분포(non-informative prior)의 원리를 제안하여 "사전 지식이 없을 때도 베이즈 추론을 쓸 수 있다"는 실용적 토대를 마련했다.

## 베이즈 정리: 학습의 수학적 구조

베이즈 정리의 핵심 공식은 다음과 같다.

P(theta|D) = P(D|theta) * P(theta) / P(D)

각 항의 의미를 풀어보면 이렇다.

- P(theta) = 사전 확률(prior). 데이터를 보기 전, 파라미터 theta에 대한 기존 믿음
- P(D|theta) = 우도(likelihood). 파라미터가 theta일 때 데이터 D가 관찰될 확률
- P(D) = 증거(evidence) 또는 주변 우도(marginal likelihood). 가능한 모든 theta에 대한 우도의 합
- P(theta|D) = 사후 확률(posterior). 데이터를 관찰한 뒤 갱신된 파라미터에 대한 믿음

더 직관적으로 줄이면 이렇다.

사후 확률은 우도 곱하기 사전 확률에 비례한다: P(theta|D) ~ P(D|theta) * P(theta)

이 구조가 말하는 것은 명료하다. 학습이란 "기존 믿음(prior)을 새로운 증거(likelihood)로 갱신하여 새로운 믿음(posterior)을 얻는 것"이다. 데이터가 누적될수록 사전 확률의 영향은 줄어들고, 우도가 사후 확률을 지배하게 된다.

## 점추정의 두 철학: MAP과 MLE

사후 확률 분포 전체를 구하기 어려울 때, 하나의 "최선의 추정값"을 뽑는 두 가지 접근이 있다.

MAP(Maximum A Posteriori) 추정:
theta_MAP = argmax P(theta|D) = argmax [P(D|theta) * P(theta)]

MAP은 사후 확률을 최대화하는 theta를 찾는다. 사전 확률의 영향을 유지하므로, 데이터가 적을 때도 합리적 추정을 제공한다.

MLE(Maximum Likelihood Estimation):
theta_MLE = argmax P(D|theta)

MLE는 사전 확률을 무시하고(= 균일 사전분포를 가정하고) 우도만 최대화한다. 데이터가 충분히 많으면 MAP과 MLE는 수렴한다.

여기서 심층 학습과의 결정적 연결이 드러난다. 신경망의 가중치 감쇠(weight decay)는 가우시안 사전분포를 부여하는 것과 수학적으로 동치다. L2 정규화 항 lambda * ||w||^2를 추가하는 것은 P(w) ~ exp(-lambda * ||w||^2)라는 가우시안 prior를 가정한 MAP 추정과 같다.

## 베이즈 프레임워크에서 AI로: 직접적 영감의 다리

베이즈 추론이 AI에 미친 영향은 비유적 차용이 아니라 수학적 동일성에 기반한다.

첫째, 베이즈 신경망(Bayesian Neural Networks). MacKay(1992)와 Neal(1996)은 신경망의 가중치를 고정된 값이 아니라 확률 분포로 취급할 것을 제안했다. 예측 시 단일 가중치가 아닌 가중치 분포 전체에 대해 적분하여 예측 분포를 구한다. 이를 통해 모델은 "이 입력에 대해 내가 얼마나 확신하는지"를 정량적으로 표현할 수 있다. 자율주행이나 의료 진단처럼 불확실성 인식이 생명과 직결되는 응용에서 이 능력은 결정적이다.

둘째, Gal과 Ghahramani(2016)의 MC-Dropout. 이들은 놀라운 연결을 발견했다. 이미 널리 쓰이던 드롭아웃(Dropout)을 추론 시에도 여러 번 적용하면, 그 결과가 베이즈 신경망의 근사적 사후 추론과 수학적으로 동치라는 것이다. 기존 신경망을 거의 수정하지 않고도 불확실성을 추정할 수 있게 한 이 발견은, 베이즈 방법의 실용적 접근성을 획기적으로 높였다.

셋째, 베이즈 최적화(Bayesian Optimization). 하이퍼파라미터 탐색에서 가우시안 프로세스(GP)를 사전 확률로 사용하고, 각 실험 결과로 사후 확률을 갱신하며, 획득 함수(acquisition function)로 다음 실험 지점을 결정한다. 이 과정은 베이즈 정리의 순환적 갱신 구조를 그대로 따른다.

넷째, 모델 평균화(Model Averaging). 베이즈 사후 예측 분포는 가능한 모든 모델에 대해 사후 확률로 가중평균한다. 앙상블 학습의 이론적 정당화가 바로 여기에 있다.

## 계산적 도전: 정확한 사후 분포를 구할 수 없다

베이즈 추론의 가장 큰 실무적 장벽은 분모 P(D) = integral P(D|theta) * P(theta) d(theta)의 계산이다. 이 적분은 파라미터 공간이 고차원일 때(현대 신경망은 수백만~수십억 차원) 해석적으로 풀 수 없다.

이를 우회하는 두 가지 주요 전략이 발전했다.

MCMC(Markov Chain Monte Carlo). Neal(1996)이 신경망에 적용한 하이브리드 몬테카를로(HMC)는 사후 분포에서 직접 샘플링한다. 이론적으로 정확하지만 수렴이 느리고 대규모 모델에 적용하기 어렵다.

변분 추론(Variational Inference). 사후 분포 P(theta|D)를 단순한 분포 q(theta)로 근사하고, KL divergence를 최소화한다. Blundell et al.(2015)의 Bayes by Backprop이 대표적이다. 정확도는 떨어지지만 확장성이 좋아 대규모 모델에 적용 가능하다.

## 사전 확률의 딜레마

베이즈 추론에 대한 가장 근본적인 비판은 사전 확률의 주관성이다. "데이터를 보기 전의 믿음"을 어떻게 정당화할 수 있는가? Jeffreys(1939)의 비정보적 사전분포, 최대 엔트로피 사전분포, 경험적 베이즈(empirical Bayes) 등 다양한 해법이 제안되었지만, 완전히 "객관적인" 사전분포는 존재하지 않는다.

그러나 이 약점은 역설적으로 AI에서 강점이 되기도 한다. 사전 확률은 도메인 지식을 모델에 명시적으로 주입하는 통로다. 희소 데이터 환경에서 적절한 사전분포는 과적합을 방지하고 일반화 성능을 높인다. 정규화(regularization)가 바로 이 원리의 빈도주의적 번역이다.

## 한계와 약점

- **계산 비용**: 정확한 사후 추론은 대규모 모델에서 여전히 비실용적이다. MCMC는 너무 느리고, 변분 추론은 근사 오차를 수반한다. 이 때문에 현대 딥러닝의 주류는 점추정(SGD 기반 MLE/MAP)에 머물러 있다.
- **사전분포 민감성**: 데이터가 적을 때 사전분포 선택이 결과를 지배한다. 잘못된 사전분포는 편향된 추론을 낳는다. 이 주관성은 객관적 방법론을 추구하는 과학적 맥락에서 지속적 논쟁거리다.
- **모델 비교의 한계**: 베이즈 인수(Bayes factor)를 이용한 모델 비교는 사전분포에 극도로 민감하다. Lindley의 역설은 이 문제를 날카롭게 보여준다.
- **딥러닝과의 괴리**: 현대 심층 신경망이 사후 추론 없이도 뛰어난 성능을 보이는 이유는 아직 완전히 설명되지 않았다. 베이즈 프레임워크가 딥러닝의 성공을 설명하는 올바른 렌즈인지에 대한 논쟁이 계속되고 있다.

## 용어 정리

사전 확률(prior) - 데이터를 관찰하기 전 파라미터에 대해 갖고 있는 기존 확률 분포

사후 확률(posterior) - 데이터를 관찰한 뒤 베이즈 정리를 통해 갱신된 파라미터의 확률 분포

우도(likelihood) - 특정 파라미터 값이 주어졌을 때 관찰된 데이터가 나타날 확률

주변 우도(marginal likelihood) - 모든 가능한 파라미터에 대해 우도를 적분한 값. 증거(evidence)라고도 부름

MAP 추정(maximum a posteriori) - 사후 확률을 최대화하는 파라미터 값을 구하는 점추정 방법

베이즈 신경망(Bayesian neural network) - 가중치를 확률 분포로 취급하여 예측의 불확실성을 정량화하는 신경망

변분 추론(variational inference) - 다루기 어려운 사후 분포를 단순한 분포로 근사하는 기법

비정보적 사전분포(non-informative prior) - 특정 파라미터 값을 선호하지 않도록 설계된 사전분포. Jeffreys prior가 대표적

획득 함수(acquisition function) - 베이즈 최적화에서 다음 탐색 지점을 결정하는 함수. Expected Improvement(EI)가 대표적

모델 평균화(model averaging) - 여러 모델의 예측을 사후 확률로 가중평균하여 단일 모델보다 강건한 예측을 구하는 방법

---EN---
Bayesian Inference - The fundamental probabilistic framework for learning from data by updating beliefs with evidence

## Historical Origins: A Minister's Legacy and a Mathematician's Completion

The seed of Bayesian Inference was planted in a posthumously published paper by the English Presbyterian minister Thomas Bayes (1701-1761): "An Essay towards solving a Problem in the Doctrine of Chances" (1763). In this paper, Bayes posed a simple yet profound question: "After observing an outcome, how can we calculate the probability of the cause that produced it?" This reversed the usual direction of probabilistic reasoning -- from cause to effect.

Pierre-Simon Laplace (1812) formalized it into a rigorous mathematical framework, making Bayes' theorem a central tool in probability theory. In the 20th century, Harold Jeffreys (1939) proposed the principle of non-informative priors, establishing the practical foundation that "Bayesian reasoning can be used even without prior knowledge."

## Bayes' Theorem: The Mathematical Structure of Learning

The core formula of Bayes' theorem is:

P(theta|D) = P(D|theta) * P(theta) / P(D)

Each term means:

- P(theta) = Prior. Existing belief about parameter theta before seeing data
- P(D|theta) = Likelihood. The probability of observing data D given parameter theta
- P(D) = Evidence or marginal likelihood. The sum of likelihoods over all possible theta values
- P(theta|D) = Posterior. Updated belief about theta after observing data

More intuitively:

Posterior is proportional to likelihood times prior: P(theta|D) ~ P(D|theta) * P(theta)

What this structure says is clear: learning is "updating existing beliefs (prior) with new evidence (likelihood) to obtain new beliefs (posterior)." As data accumulates, the prior's influence diminishes and the likelihood dominates the posterior.

## Two Philosophies of Point Estimation: MAP and MLE

When computing the full posterior distribution is intractable, two approaches extract a single "best estimate":

MAP (Maximum A Posteriori) estimation:
theta_MAP = argmax P(theta|D) = argmax [P(D|theta) * P(theta)]

MAP finds theta that maximizes the posterior. By retaining the prior's influence, it provides reasonable estimates even with limited data.

MLE (Maximum Likelihood Estimation):
theta_MLE = argmax P(D|theta)

MLE ignores the prior (equivalently assuming a uniform prior) and maximizes only the likelihood. With sufficient data, MAP and MLE converge.

Here a critical connection to deep learning emerges. Weight decay in neural networks is mathematically equivalent to imposing a Gaussian prior. Adding the L2 regularization term lambda * ||w||^2 is the same as MAP estimation assuming P(w) ~ exp(-lambda * ||w||^2) as a Gaussian prior.

## From Bayesian Framework to AI: Bridges of Direct Inspiration

Bayesian inference's impact on AI is based not on metaphorical borrowing but on mathematical identity.

First, Bayesian Neural Networks. MacKay (1992) and Neal (1996) proposed treating neural network weights not as fixed values but as probability distributions. At prediction time, instead of using a single weight, one integrates over the entire weight distribution to obtain a predictive distribution. This allows models to quantitatively express "how confident I am about this input" -- a critical capability in applications like autonomous driving and medical diagnosis where uncertainty awareness is a matter of life and death.

Second, MC-Dropout by Gal and Ghahramani (2016). They discovered a remarkable connection: applying the already widely-used Dropout at inference time multiple times is mathematically equivalent to approximate posterior inference in a Bayesian neural network. This discovery, enabling uncertainty estimation with minimal modifications to existing networks, dramatically improved the practical accessibility of Bayesian methods.

Third, Bayesian Optimization. In hyperparameter search, a Gaussian Process (GP) serves as the prior, each experimental result updates the posterior, and an acquisition function determines the next experiment point. This process directly follows the iterative update structure of Bayes' theorem.

Fourth, Model Averaging. The Bayesian posterior predictive distribution is a weighted average over all possible models using posterior probabilities. This provides the theoretical justification for ensemble learning.

## Computational Challenge: The Exact Posterior Is Intractable

The greatest practical barrier in Bayesian inference is computing the denominator P(D) = integral P(D|theta) * P(theta) d(theta). This integral is analytically unsolvable when the parameter space is high-dimensional (modern neural networks have millions to billions of dimensions).

Two major strategies have been developed to circumvent this.

MCMC (Markov Chain Monte Carlo). Hybrid Monte Carlo (HMC), applied to neural networks by Neal (1996), samples directly from the posterior distribution. Theoretically exact but slow to converge and difficult to apply to large-scale models.

Variational Inference. Approximates the posterior P(theta|D) with a simpler distribution q(theta) by minimizing the KL divergence. Bayes by Backprop (Blundell et al. 2015) is a prime example. Less accurate but scalable, making it applicable to large models.

## The Prior Dilemma

The most fundamental criticism of Bayesian inference is the subjectivity of the prior. How can one justify "beliefs before seeing data"? Various solutions have been proposed -- Jeffreys' (1939) non-informative priors, maximum entropy priors, and empirical Bayes -- but a completely "objective" prior does not exist.

Yet this weakness paradoxically becomes a strength in AI. The prior is an explicit channel for injecting domain knowledge into models. In sparse data environments, appropriate priors prevent overfitting and improve generalization. Regularization is precisely the frequentist translation of this principle.

## Limitations and Weaknesses

- **Computational cost**: Exact posterior inference remains impractical for large models. MCMC is too slow; variational inference introduces approximation error. This is why mainstream modern deep learning remains at point estimation (SGD-based MLE/MAP).
- **Prior sensitivity**: When data is scarce, the choice of prior dominates the results. A poorly chosen prior produces biased inference. This subjectivity remains a persistent point of debate in scientific contexts pursuing objectivity.
- **Model comparison limitations**: Bayesian model comparison via Bayes factors is extremely sensitive to prior specification. Lindley's paradox sharply illustrates this problem.
- **Gap with deep learning**: Why modern deep neural networks achieve excellent performance without posterior inference is not yet fully explained. The debate continues on whether the Bayesian framework is the right lens to explain deep learning's success.

## Glossary

Prior - the probability distribution representing existing beliefs about a parameter before observing any data

Posterior - the updated probability distribution of a parameter after applying Bayes' theorem to observed data

Likelihood - the probability of observing the data given a specific parameter value

Marginal likelihood - the integral of the likelihood over all possible parameter values; also called evidence

MAP estimation (maximum a posteriori) - a point estimation method that finds the parameter value maximizing the posterior probability

Bayesian neural network - a neural network that treats weights as probability distributions to quantify prediction uncertainty

Variational inference - a technique for approximating an intractable posterior distribution with a simpler distribution

Non-informative prior - a prior designed not to favor any particular parameter value; Jeffreys prior is the most representative example

Acquisition function - a function in Bayesian optimization that determines the next exploration point; Expected Improvement (EI) is the most common

Model averaging - combining predictions from multiple models weighted by their posterior probabilities to achieve more robust predictions than any single model
