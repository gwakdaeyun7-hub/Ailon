---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 섀넌 엔트로피, 정보량, 교차 엔트로피, 손실 함수, 정보 이득, 불확실성, 최소 기술 길이
keywords_en: Shannon entropy, information content, cross-entropy, loss function, information gain, uncertainty, minimum description length
---
Shannon Entropy and Information Theory - 확률 분포의 불확실성을 정량화하는 척도로, AI의 손실 함수와 학습 이론의 수학적 기반을 제공한 핵심 개념

## 하나의 논문이 하나의 분야를 창조하다

1948년, Bell Labs의 Claude Shannon이 발표한 "A Mathematical Theory of Communication"은 과학사에서 보기 드문 사건이다. 한 편의 논문이 정보 이론(information theory)이라는 완전히 새로운 학문 분야를 창조했다. Shannon의 핵심 통찰은, 정보를 **의미**(semantics)와 분리하여 **불확실성의 해소**로 정의한 것이다. 메시지의 내용이 무엇이든, 수신자의 불확실성을 얼마나 줄이느냐가 정보의 양이다.

Shannon은 불확실성의 유일한 합리적 척도를 유도했다. 세 가지 공리 -- (1) 연속성, (2) 균일 분포일 때 사건 수에 대한 단조증가, (3) 조건부 분해 가능성 -- 를 만족하는 유일한 함수가 바로 엔트로피다.

H(X) = -sum_{x} p(x) log p(x)

여기서 p(x)는 확률변수 X가 값 x를 취할 확률이다. 로그의 밑이 2이면 단위는 비트(bit), e이면 나트(nat)다. 이 함수의 직관은 명쾌하다. 동전 던지기(p=0.5)의 불확실성은 1비트, 확실한 사건(p=1)의 불확실성은 0비트다.

## 엔트로피의 물리학적 기원과 차이

Shannon이 "엔트로피"라는 이름을 선택한 것은 유명한 일화에서 비롯된다. John von Neumann이 Shannon에게 이렇게 조언했다고 전해진다. "엔트로피라고 부르세요. 첫째, 수학적 형태가 통계역학의 엔트로피와 동일합니다. 둘째, 아무도 엔트로피가 뭔지 정확히 모르니까 논쟁에서 항상 유리할 겁니다."

일화의 진위와 별개로, 수학적 유사성은 실재한다. Boltzmann의 통계역학적 엔트로피 S = -k_B * sum p_i ln p_i와 Shannon 엔트로피의 형태는 동일하다. 그러나 중요한 차이가 있다. 물리학의 엔트로피는 열역학 제2법칙에 의해 고립계에서 항상 증가하는 물리량이다. Shannon 엔트로피는 확률 분포의 수학적 속성이지 물리적 과정의 방향성을 기술하지 않는다. 유사한 수식이 서로 다른 존재론적 지위를 가진다.

## 결합 엔트로피와 조건부 엔트로피

두 확률변수 X와 Y의 결합 엔트로피(joint entropy)는 다음과 같다.

H(X, Y) = -sum_{x,y} p(x, y) log p(x, y)

Y를 알 때 X의 남은 불확실성인 조건부 엔트로피(conditional entropy)는 다음과 같다.

H(X|Y) = H(X, Y) - H(Y)

항상 H(X|Y) <= H(X)가 성립한다. Y를 아는 것이 X에 대한 불확실성을 **줄이거나 유지**할 뿐 **증가시키지 않는다**. 이것이 "정보는 불확실성을 줄인다"는 Shannon의 정의와 정확히 일치한다. 이 부등식은 머신러닝에서 특징 선택(feature selection)의 이론적 근거가 된다.

## 교차 엔트로피: AI의 핵심 손실 함수

교차 엔트로피(cross-entropy)는 Shannon 엔트로피의 직접적 확장이다.

H(p, q) = -sum_{x} p(x) log q(x)

p는 실제 분포(true distribution), q는 모델의 예측 분포다. 교차 엔트로피는 분류 문제에서 가장 널리 쓰이는 손실 함수다. 이유는 수학적으로 명확하다. 교차 엔트로피를 최소화하는 것은 KL 발산을 최소화하는 것과 동치이기 때문이다.

H(p, q) = H(p) + D_KL(p || q)

H(p)는 실제 분포의 엔트로피로 학습 중 상수다. 따라서 H(p, q)를 최소화하면 D_KL(p||q)가 최소화되고, 이는 q가 p에 최대한 가까워지도록 학습하는 것을 의미한다. 원-핫 레이블(p(정답)=1, 나머지=0)에서 교차 엔트로피는 -log q(정답)으로 단순화된다. 모델이 정답에 높은 확률을 부여할수록 손실이 작아진다.

이 연결은 우연이 아니다. 신경망의 분류 학습은 **정보 이론적 최적 코딩**을 달성하려는 과정으로 재해석할 수 있다. 교차 엔트로피가 Shannon 엔트로피와 같아지는 순간, 모델은 데이터 생성 과정을 완벽히 학습한 것이다.

## 결정 트리의 정보 이득

Quinlan(1986)의 ID3(Iterative Dichotomiser 3) 알고리즘은 Shannon 엔트로피를 분류 학습에 직접 활용한 최초의 중요한 사례다. 결정 트리가 데이터를 분할할 때, 어떤 특징(feature)으로 나눌지를 **정보 이득**(information gain)으로 결정한다.

IG(S, A) = H(S) - sum_{v in values(A)} |S_v|/|S| * H(S_v)

S는 현재 데이터 집합, A는 분할 후보 특징, S_v는 특징 A의 값이 v인 부분 집합이다. 정보 이득은 분할 전 엔트로피에서 분할 후 가중 평균 엔트로피를 뺀 것으로, 해당 특징이 불확실성을 얼마나 줄이는지를 정량화한다. 가장 많은 불확실성을 해소하는 특징부터 분할하는 것이 ID3의 전략이다.

C4.5에서는 정보 이득 대신 정보 이득비(gain ratio)를 사용하여 다치 특징(many-valued attribute)에 대한 편향을 보정했다. 그러나 핵심 원리는 동일하다. Shannon의 엔트로피로 불확실성을 측정하고, 불확실성 감소를 기준으로 의사결정을 내린다.

## VAE와 최소 기술 길이

변분 오토인코더(Variational Autoencoder, VAE)의 목적 함수인 ELBO(Evidence Lower BOund)에도 Shannon 엔트로피의 정보 이론적 해석이 내재되어 있다. ELBO의 KL 항은 잠재 변수 분포 q(z|x)가 사전 분포 p(z)로부터 얼마나 벗어나는지를 엔트로피 기반으로 측정한다. 이 항을 최소화하면 잠재 표현이 불필요하게 복잡해지는 것을 방지한다.

이것은 **최소 기술 길이**(Minimum Description Length, MDL) 원리와 연결된다. Rissanen(1978)이 제안한 MDL은 데이터를 가장 짧게 기술하는 모델이 최선이라는 원리다. Shannon의 원래 통찰 -- 최적 코드의 길이가 -log p(x)이므로 낮은 엔트로피의 분포가 더 효율적으로 부호화된다 -- 이 여기서 학습 이론의 정규화(regularization)로 확장된 것이다.

## 한계와 약점

Shannon 엔트로피가 AI의 근본적 도구가 되었지만, 한계도 명확하다.

- **알려진 분포 가정**: 엔트로피 계산은 확률 분포 p(x)를 알고 있다고 가정한다. 현실에서 진정한 데이터 분포는 미지이며, 유한 데이터에서 추정한 분포로 계산한 엔트로피는 편향(bias)을 가진다. 샘플 수가 부족하면 엔트로피가 과소추정되는 경향이 있다.
- **로그 밑 의존성**: 엔트로피의 절대값은 로그의 밑에 따라 달라진다. 비트(log2)와 나트(ln)는 상수 배만큼 다르며, 이 선택 자체에는 정보 이론적 근거가 없다. 단위의 선택일 뿐이다.
- **의미론적 무관심**: Shannon이 의도적으로 정보에서 의미를 제거한 것은 수학적 엄밀성을 위해 필요했지만, 이 때문에 "의미 있는 정보"와 "의미 없는 정보"를 구분할 수 없다. 무작위 잡음은 최대 엔트로피를 가지지만, 유용한 정보는 전혀 포함하지 않는다.
- **연속 분포에서의 문제**: 이산 엔트로피를 연속 변수로 확장한 미분 엔트로피(differential entropy)는 좌표 변환에 불변이 아니며 음수가 될 수 있다. 이는 이산 엔트로피의 깔끔한 해석이 연속 영역에서는 성립하지 않음을 의미한다.
- **교차 엔트로피와 레이블 품질**: 교차 엔트로피 손실은 레이블이 정확하다고 가정한다. 노이즈 레이블(noisy labels)이 있으면, 모델이 잘못된 분포를 학습하게 된다. 레이블 스무딩(label smoothing) 같은 기법이 이 문제를 부분적으로 완화한다.

## 용어 정리

엔트로피(entropy) - 확률 분포의 평균적 불확실성 또는 평균 정보량, H(X) = -sum p(x) log p(x)

비트(bit) - 정보의 기본 단위, 동등한 확률의 이진 선택이 가지는 정보량

교차 엔트로피(cross-entropy) - 실제 분포 p로 발생한 데이터를 모델 분포 q의 코드로 부호화할 때 필요한 평균 비트 수

정보 이득(information gain) - 특정 특징으로 데이터를 분할했을 때 감소하는 엔트로피의 양

결합 엔트로피(joint entropy) - 두 확률변수의 결합 분포가 가지는 총 불확실성

조건부 엔트로피(conditional entropy) - 하나의 변수를 알 때 다른 변수에 남아있는 불확실성

최소 기술 길이(Minimum Description Length, MDL) - 데이터를 가장 짧게 기술하는 모델이 최선이라는 학습 원리

미분 엔트로피(differential entropy) - 연속 확률변수에 대한 엔트로피의 확장, 좌표 변환에 불변이 아님

레이블 스무딩(label smoothing) - 원-핫 레이블의 확률 일부를 다른 클래스에 분배하여 과적합을 줄이는 정규화 기법

---EN---
Shannon Entropy and Information Theory - A measure quantifying the uncertainty of probability distributions, providing the mathematical foundation for AI loss functions and learning theory

## One Paper Creates an Entire Field

In 1948, Claude Shannon at Bell Labs published "A Mathematical Theory of Communication" -- a rare event in the history of science where a single paper creates an entirely new academic discipline: information theory. Shannon's core insight was defining information as **uncertainty reduction**, separated from **semantics**. Regardless of a message's content, the amount of information is measured by how much it reduces the receiver's uncertainty.

Shannon derived the unique rational measure of uncertainty. Three axioms -- (1) continuity, (2) monotonic increase with event count for uniform distributions, (3) conditional decomposability -- yield exactly one function: entropy.

H(X) = -sum_{x} p(x) log p(x)

Here p(x) is the probability that random variable X takes value x. When the logarithm base is 2, the unit is bits; when it is e, the unit is nats. The function's intuition is clear: a fair coin flip (p=0.5) has 1 bit of uncertainty; a certain event (p=1) has 0 bits.

## Physical Origins and Differences

Shannon's choice of the name "entropy" stems from a famous anecdote. John von Neumann reportedly advised Shannon: "Call it entropy. First, the mathematical form is identical to entropy in statistical mechanics. Second, nobody really knows what entropy is, so in any debate you'll always have the advantage."

Regardless of the anecdote's authenticity, the mathematical similarity is real. Boltzmann's statistical mechanical entropy S = -k_B * sum p_i ln p_i has the same form as Shannon entropy. But there is an important difference. Physical entropy is a quantity that always increases in isolated systems according to the second law of thermodynamics. Shannon entropy is a mathematical property of probability distributions and does not describe the directionality of physical processes. Similar formulas carry different ontological status.

## Joint and Conditional Entropy

The joint entropy of two random variables X and Y is:

H(X, Y) = -sum_{x,y} p(x, y) log p(x, y)

Conditional entropy -- the remaining uncertainty about X when Y is known -- is:

H(X|Y) = H(X, Y) - H(Y)

The inequality H(X|Y) <= H(X) always holds. Knowing Y can only **reduce or maintain** uncertainty about X, never **increase** it. This aligns precisely with Shannon's definition that "information reduces uncertainty." This inequality provides the theoretical basis for feature selection in machine learning.

## Cross-Entropy: AI's Core Loss Function

Cross-entropy is a direct extension of Shannon entropy:

H(p, q) = -sum_{x} p(x) log q(x)

Here p is the true distribution and q is the model's predicted distribution. Cross-entropy is the most widely used loss function in classification. The reason is mathematically clear -- minimizing cross-entropy is equivalent to minimizing KL divergence:

H(p, q) = H(p) + D_KL(p || q)

H(p), the entropy of the true distribution, is constant during training. Therefore minimizing H(p, q) minimizes D_KL(p||q), meaning the model learns to make q as close to p as possible. With one-hot labels (p(correct)=1, rest=0), cross-entropy simplifies to -log q(correct). The higher the probability the model assigns to the correct answer, the smaller the loss.

This connection is no coincidence. Neural network classification training can be reinterpreted as striving to achieve **information-theoretically optimal coding**. The moment cross-entropy equals Shannon entropy, the model has perfectly learned the data-generating process.

## Information Gain in Decision Trees

Quinlan's (1986) ID3 (Iterative Dichotomiser 3) algorithm was the first major instance of directly applying Shannon entropy to classification learning. When a decision tree splits data, it determines which feature to split on using **information gain**:

IG(S, A) = H(S) - sum_{v in values(A)} |S_v|/|S| * H(S_v)

S is the current dataset, A is the candidate feature, and S_v is the subset where feature A has value v. Information gain subtracts the weighted average entropy after splitting from the entropy before splitting, quantifying how much uncertainty a feature resolves. ID3's strategy is to split on the feature that resolves the most uncertainty first.

C4.5 replaced information gain with the gain ratio to correct bias toward many-valued attributes. But the core principle remains identical: measure uncertainty with Shannon entropy, and make decisions based on uncertainty reduction.

## VAEs and Minimum Description Length

The ELBO (Evidence Lower BOund), the objective function of Variational Autoencoders (VAEs), also embeds an information-theoretic interpretation of Shannon entropy. The ELBO's KL term measures, in an entropy-based way, how far the latent variable distribution q(z|x) deviates from the prior p(z). Minimizing this term prevents the latent representation from becoming unnecessarily complex.

This connects to the **Minimum Description Length (MDL)** principle. Proposed by Rissanen (1978), MDL states that the model providing the shortest description of data is best. Shannon's original insight -- that optimal code length is -log p(x), so lower-entropy distributions encode more efficiently -- extends here into regularization in learning theory.

## Limitations and Weaknesses

While Shannon entropy has become a fundamental tool of AI, its limitations are clear.

- **Known distribution assumption**: Entropy computation assumes the probability distribution p(x) is known. In reality, the true data distribution is unknown, and entropy computed from a distribution estimated from finite data carries bias. With insufficient samples, entropy tends to be underestimated.
- **Logarithm base dependence**: The absolute value of entropy varies with the logarithm base. Bits (log2) and nats (ln) differ by a constant factor, and this choice itself has no information-theoretic basis -- it is merely a unit convention.
- **Semantic indifference**: Shannon's intentional removal of meaning from information was necessary for mathematical rigor, but it means "meaningful information" cannot be distinguished from "meaningless information." Random noise has maximum entropy but contains no useful information.
- **Continuous distribution issues**: Differential entropy -- the extension of discrete entropy to continuous variables -- is not invariant under coordinate transformations and can be negative. This means the clean interpretation of discrete entropy does not hold in the continuous domain.
- **Cross-entropy and label quality**: Cross-entropy loss assumes labels are accurate. With noisy labels, the model learns an incorrect distribution. Techniques like label smoothing partially mitigate this problem.

## Glossary

Entropy - the average uncertainty or average information content of a probability distribution, H(X) = -sum p(x) log p(x)

Bit - the fundamental unit of information, the information content of a binary choice between equally likely outcomes

Cross-entropy - the average number of bits needed to encode data from true distribution p using codes from model distribution q

Information gain - the amount of entropy reduction when data is split by a specific feature

Joint entropy - the total uncertainty of the joint distribution of two random variables

Conditional entropy - the remaining uncertainty about one variable when another is known

Minimum Description Length (MDL) - the learning principle that the model providing the shortest description of data is best

Differential entropy - the extension of entropy to continuous random variables, not invariant under coordinate transformations

Label smoothing - a regularization technique that distributes some probability from one-hot labels to other classes to reduce overfitting
